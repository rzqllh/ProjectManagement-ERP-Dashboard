import { VectorStore } from "@langchain/core/vectorstores";
import { EmbeddingsInterface } from "@langchain/core/embeddings";
import { Document, DocumentInterface } from "@langchain/core/documents";

interface VectorDocument {
    vector: number[];
    document: DocumentInterface;
}

export class SimpleVectorStore extends VectorStore {
    FilterType: Record<string, any>;
    private vectors: VectorDocument[] = [];

    constructor(embeddings: EmbeddingsInterface) {
        super(embeddings, {});
        this.FilterType = {};
    }

    _vectorstoreType(): string {
        return "simple_in_memory";
    }

    async addDocuments(documents: DocumentInterface[]): Promise<void> {
        const texts = documents.map(({ pageContent }) => pageContent);
        const vectors = await this.embeddings.embedDocuments(texts);
        return this.addVectors(vectors, documents);
    }

    async addVectors(
        vectors: number[][],
        documents: DocumentInterface[]
    ): Promise<void> {
        const rows = vectors.map((vector, idx) => ({
            vector,
            document: documents[idx],
        }));
        this.vectors.push(...rows);
    }

    async similaritySearchVectorWithScore(
        query: number[],
        k: number
    ): Promise<[DocumentInterface, number][]> {
        const similarity = (a: number[], b: number[]) => {
            let dot = 0;
            let magA = 0;
            let magB = 0;
            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                magA += a[i] * a[i];
                magB += b[i] * b[i];
            }
            return dot / (Math.sqrt(magA) * Math.sqrt(magB));
        };

        const searches = this.vectors
            .map((entry) => ({
                similarity: similarity(query, entry.vector),
                document: entry.document,
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, k);

        return searches.map((result) => [result.document, result.similarity]);
    }

    static async fromDocuments(
        docs: DocumentInterface[],
        embeddings: EmbeddingsInterface
    ): Promise<SimpleVectorStore> {
        const store = new SimpleVectorStore(embeddings);
        await store.addDocuments(docs);
        return store;
    }
}
