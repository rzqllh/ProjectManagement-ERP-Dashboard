---
description: PERSONAL PMO ERP CONTROL CENTER
---

# PERSONAL PMO ERP CONTROL CENTER

Version: 1.0
Owner: Internal Use Only
Purpose: Build a unified Personal PMO Operating System integrated with AI Brain (CANERIS) and Automation Hub.

---

## SECTION 1: SYSTEM OBJECTIVE

Build a web based ERP style application for single user usage that:

1. Acts as daily command center.
2. Tracks ND lifecycle and dependencies.
3. Tracks multi project execution and blockers.
4. Maintains structured decision intelligence.
5. Provides AI assisted reasoning and drafting.
6. Connects to Telegram bot for remote interaction.
7. Operates on free priority stack where possible.

This is not a simple tracker. This is a structured operational system.

---

## SECTION 2: HIGH LEVEL ARCHITECTURE

Layer 1: Frontend

* Next.js web application
* Role: UI, dashboard, editor, visualization

Layer 2: Backend API

* Next.js API routes or Node.js server
* Handles business logic, AI calls, automation triggers

Layer 3: Database

* Firestore
* Stores ND records, projects, decisions, notes, logs

Layer 4: AI Layer

* Gemini API or similar
* RAG implementation using internal indexed data

Layer 5: Automation Layer

* Telegram bot server
* Scheduled jobs for report generation

Deployment Strategy (Free Priority):

* Frontend + API: Vercel free tier
* Bot: Render or Railway free tier
* Database + Auth: Firebase free tier

---

## SECTION 3: CORE MODULES

MODULE 1: MORNING COMMAND DASHBOARD

Purpose:
Single screen daily operational overview.

Components:

* ND Received (last 24h)
* ND Without Next Action
* ND Overdue
* Projects With Active Blockers
* Escalation Candidates
* Meetings Today

Logic Rules:

* Every ND must have next_action field.
* If status = waiting_external > 5 days -> risk flag.
* If > 10 days -> escalation flag.

Data Required:

* nde_records collection
* timeline_events collection

---

## MODULE 2: ND MANAGEMENT SYSTEM

Entity: nde_record

Fields:

* id
* nd_number
* title
* sender
* receiver
* category (business, technical, guidance, order, access, other)
* related_project_id
* parent_nd_id
* child_nd_ids
* status (waiting_external, waiting_internal, drafting, issued, clear, escalated)
* next_action
* pic
* deadline
* blocker_description
* created_at
* updated_at
* attachment_links

Features:

* ND relational linking (parent and child)
* Status change log
* Timeline auto logging
* Attach file support

Derived Metrics:

* Average ND response time
* ND backlog count

---

## MODULE 3: PROJECT DEPENDENCY BOARD

Entity: project

Fields:

* id
* name
* description
* status (active, hold, completed)
* risk_level
* start_date
* target_date

Each project contains sections:

* Business Clearance
* Technical Guidance
* Order Issuance
* SARPEN
* Integration
* Migration
* Escalation

Each section has:

* status
* pic
* blocker
* last_update
* related_nd_ids

View Types:

* Kanban view
* Structured table view
* Timeline view

---

## MODULE 4: DECISION LOG + THINKING SYSTEM

Entity: decision_log

Fields:

* id
* title
* problem_statement
* context_reference (nd_id or project_id)
* options_considered (array)
* risk_analysis
* selected_option
* reasoning
* expected_impact
* decision_date
* review_date
* outcome

Thinking Templates:

* Tradeoff Matrix
* Risk vs Impact scoring
* Pre Mortem
* Post Mortem

AI Assistance:

* Generate structured option comparison
* Generate risk summary
* Detect hidden dependency from linked ND

---

## MODULE 5: RICH NOTES SYSTEM

Editor Requirements:

* Rich text formatting
* Bullet list
* Checklist
* Table
* Image upload
* Code block

Entity: note

Fields:

* id
* title
* content_json
* tags
* related_nd_ids
* related_project_ids
* created_at

Search:

* Keyword search
* Tag filter

---

## MODULE 6: TIMELINE + ESCALATION ENGINE

Entity: timeline_event

Fields:

* id
* related_type (nd, project, decision)
* related_id
* event_type
* date
* description

Escalation Engine Logic:

* Daily scheduled job
* Evaluate ND age
* Evaluate blocker duration
* Generate escalation_flags

Entity: escalation_flag

* id
* related_id
* type
* level (risk, escalation)
* generated_at

---

## MODULE 7: CANERIS AI BRAIN

Capabilities:

1. ND drafting assistance
2. Weekly report generation
3. Dependency reasoning
4. Risk identification
5. Decision simulation

RAG Implementation:
Step 1: Store ND, notes, decisions in structured format
Step 2: On query, retrieve related records
Step 3: Send to LLM with structured prompt
Step 4: Return structured output

AI Response Format Must Be Structured JSON:

* summary
* risk_identified
* recommended_action
* reasoning
* confidence_level

Constraints:

* AI cannot auto change database without confirmation
* AI suggestions must require manual approval

---

## MODULE 8: PERSONAL AUTOMATION HUB

Telegram Bot Capabilities:

* /morning
* /nd_summary
* /project_status
* /decision_help
* /generate_report

Bot Flow:
User -> Telegram -> Bot Server -> Backend API -> Firestore + AI -> Response

Security:

* Telegram user_id whitelist
* Token stored securely in environment variables

---

## SECTION 4: DATA STRUCTURE SUMMARY

Collections:

* nde_records
* projects
* project_sections
* decision_logs
* notes
* timeline_events
* escalation_flags
* ai_query_logs

All records must contain:

* created_at
* updated_at

---

## SECTION 5: DEVELOPMENT PHASE STRATEGY

Phase 1:

* ND management
* Dashboard
* Basic project board

Phase 2:

* Decision log
* Timeline
* Escalation engine

Phase 3:

* AI Brain integration
* RAG indexing

Phase 4:

* Telegram bot
* Automation rules

---

## SECTION 6: NON FUNCTIONAL REQUIREMENTS

Performance:

* Dashboard load < 2 seconds

Security:

* Firebase auth required
* Firestore rules restrict read and write

Backup:

* Weekly export to JSON

Data Sensitivity:

* Do not expose ND data to public endpoints

---

## SECTION 7: FUTURE EXTENSION

* Vector database for advanced semantic search
* KPI performance analytics
* Stakeholder behavioral pattern tracking
* Predictive delay analysis

---

---

## SECTION 8: STAKEHOLDER INTELLIGENCE MODULE

Purpose:
Track behavioral pattern, escalation path, influence level, and response performance of each stakeholder.

Entity: stakeholder

Fields:

* id
* name
* organization
* role
* email
* escalation_to_stakeholder_id
* influence_level (low, medium, high, executive)
* typical_response_days
* risk_profile (cooperative, defensive, slow, strategic, unknown)
* notes
* created_at
* updated_at

Entity: stakeholder_interaction_log

Fields:

* id
* stakeholder_id (FK -> stakeholder.id)
* related_type (nd, project, decision)
* related_id
* interaction_type (meeting, call, ND, informal)
* summary
* sentiment (positive, neutral, negative)
* date

Derived Metrics:

* Average response time per stakeholder
* Escalation frequency
* Delay contribution score

---

## SECTION 9: ND RELATIONSHIP GRAPH ENGINE

Purpose:
Visualize ND dependency chains and cross project links.

Graph Model:
Node Types:

* ND
* Project
* Decision

Edge Types:

* parent_of
* triggers
* blocks
* references
* escalates_to

Entity: nd_edge

Fields:

* id
* from_type (nd, project, decision)
* from_id
* to_type (nd, project, decision)
* to_id
* relationship_type
* created_at

Graph Rendering Requirements:

* Directed graph
* Expand collapse node
* Highlight blocked chain
* Color code by status

---

## SECTION 10: COMPLETE DATABASE RELATION MODEL

Primary Collections:

1. nde_records
2. projects
3. project_sections
4. decision_logs
5. notes
6. timeline_events
7. escalation_flags
8. stakeholders
9. stakeholder_interaction_logs
10. nd_edges
11. ai_query_logs

---

## RELATIONAL STRUCTURE DETAIL

nde_records

* id (PK)
* related_project_id (FK -> projects.id)
* parent_nd_id (FK -> nde_records.id, nullable)

Relations:

* One project has many ND
* One ND can have many child ND
* One ND can have many edges via nd_edges

projects

* id (PK)

Relations:

* One project has many project_sections
* One project has many ND
* One project has many decisions
* One project has many notes

project_sections

* id (PK)
* project_id (FK -> projects.id)

Relations:

* One section may reference multiple ND

project_section_nd_map
(For many to many relationship)

* id
* section_id (FK -> project_sections.id)
* nd_id (FK -> nde_records.id)

decision_logs

* id (PK)
* related_project_id (FK -> projects.id, nullable)
* related_nd_id (FK -> nde_records.id, nullable)

notes

* id (PK)

Many to Many Mapping Tables:

note_nd_map

* id
* note_id (FK -> notes.id)
* nd_id (FK -> nde_records.id)

note_project_map

* id
* note_id (FK -> notes.id)
* project_id (FK -> projects.id)

timeline_events

* id (PK)
* related_type
* related_id

escalation_flags

* id (PK)
* related_type
* related_id

stakeholder_interaction_logs

* stakeholder_id (FK -> stakeholders.id)

nd_edges

* from_id
* to_id

---

## DATA NORMALIZATION RULES

1. No duplicated ND number allowed.
2. All records must contain created_at and updated_at.
3. All relationship fields must store reference ID only.
4. Soft delete flag required on major entities.
5. Status change must create timeline_event record automatically.

---

## INDEXING STRATEGY

For Firestore performance:

Create composite indexes on:

* nde_records.status + created_at
* nde_records.related_project_id + status
* projects.status
* escalation_flags.level + generated_at

Search Optimization:

* Store normalized lowercase keyword field for ND title
* Store tag array for quick filter

---

## AI RAG INDEX STRATEGY

When AI query triggered:

Step 1: Detect intent (nd, project, decision, risk, report)
Step 2: Retrieve top 10 related records using:

* related_project_id
* tag match
* recency weight
  Step 3: Construct structured context package
  Step 4: Send to LLM
  Step 5: Require structured JSON output

ai_query_logs

* id
* query_text
* detected_intent
* related_ids
* response_summary
* confidence
* created_at

---

## DATA FLOW SUMMARY

Create ND -> Auto timeline event -> Check escalation engine
Update ND status -> Log timeline -> Evaluate risk
Create decision -> Link to ND -> Update project risk
Telegram query -> Backend intent detection -> Fetch related data -> AI -> Structured reply

---

## END OF MASTER SPECIFICATION