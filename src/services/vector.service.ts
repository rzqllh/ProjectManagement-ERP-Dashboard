import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SimpleVectorStore } from '@/lib/simple-vector-store';
import { Document } from '@langchain/core/documents';
import { NdRepository } from '@/repositories/nd.repository';
import { resolveApiKey } from '@/lib/ai-client';

export class VectorService {
    private vectorStore: SimpleVectorStore | null = null;
    private ndRepo = new NdRepository();

    private async getEmbeddings() {
        const apiKey = await resolveApiKey();
        if (!apiKey) throw new Error('AI API Key not found');

        return new GoogleGenerativeAIEmbeddings({
            apiKey,
            modelName: 'embedding-001', // or text-embedding-004 if available
            taskType: "RETRIEVAL_DOCUMENT" as any,
        });
    }

    async initialize() {
        console.log('[VectorService] Initializing vector store...');
        const embeddings = await this.getEmbeddings();

        // Load all NDs
        const nds = await this.ndRepo.findAll();
        const activeNds = nds.filter(nd => !nd.soft_delete);

        const docs: Document[] = activeNds.map(nd => {
            return new Document({
                pageContent: `ND Record: ${nd.nd_number}\nTitle: ${nd.title}\nStatus: ${nd.status}\nEscalation: ${nd.escalation_level}\nReceiver: ${nd.receiver}\nSender: ${nd.sender}`,
                metadata: {
                    id: nd.id,
                    type: 'nd',
                    nd_number: nd.nd_number,
                    status: nd.status
                }
            });
        });

        // Load Decisions (Lazy load)
        const { DecisionRepository } = await import('@/repositories/decision.repository');
        const decisionRepo = new DecisionRepository();
        const decisions = await decisionRepo.findAll();
        decisions.forEach(d => {
            if (!d.soft_delete) {
                docs.push(new Document({
                    pageContent: `Decision: ${d.title}\nStatus: ${d.status}\nPriority: ${d.priority}\nOutcome: ${d.decision_outcome || 'N/A'}\nContext: ${d.context}`,
                    metadata: { id: d.id, type: 'decision', status: d.status }
                }));
            }
        });

        // Load Projects (Lazy load)
        const { ProjectRepository } = await import('@/repositories/project.repository');
        const projectRepo = new ProjectRepository();
        const projects = await projectRepo.findAll();
        projects.forEach(p => {
            if (!p.soft_delete) {
                docs.push(new Document({
                    pageContent: `Project: ${p.name}\nStatus: ${p.status}\nPriority: ${p.priority}\nDescription: ${p.description}\nCategory: ${p.category}`,
                    metadata: { id: p.id, type: 'project', status: p.status }
                }));
            }
        });

        // Initialize store with all documents
        this.vectorStore = await SimpleVectorStore.fromDocuments(docs, embeddings);
        console.log(`[VectorService] Indexed ${docs.length} documents (NDs, Decisions, Projects) using SimpleVectorStore.`);
    }

    async similaritySearch(query: string, k = 4) {
        if (!this.vectorStore) {
            await this.initialize();
        }
        return this.vectorStore!.similaritySearch(query, k);
    }
}
