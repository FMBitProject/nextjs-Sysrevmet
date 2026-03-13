PROJECT SUMMARY: ENTERPRISE-GRADE SYSTEMATIC REVIEW & META-ANALYSIS TOOL (Q1-Q3 PUBLICATION STANDARD)

Tech Stack:
- Framework: Next.js (App Router)
- Styling: Tailwind CSS & Shadcn UI
- State Management: Zustand 
- Charts: React Flow (PRISMA Diagram), Recharts/Chart.js (Forest/Funnel Plots)
- Database/Auth: Firebase 

Development Roadmap:

1. PHASE 1: Protocol & Search Strategy
   - PROSPERO Registration ID input & PICO Framework form.
   - Database Search Log (Exact Boolean queries, number of hits per database).

2. PHASE 2: PRISMA 2020 Flow & Checklist
   - Interactive PRISMA Diagram generator.
   - Integration of the PRISMA 2020 27-item Checklist.

3. PHASE 3: Data Extraction & Standardized Risk of Bias (RoB)
   - Dynamic extraction tables (Authors, Year, Continuous/Dichotomous data).
   - Standardized RoB forms: Cochrane RoB 2 (for RCTs) and NOS (for Observational studies).

4. PHASE 4: Core Meta-Analysis Engine (Statistics)
   - Effect Size calculation (SMD, MD, OR, RR) & Study Weights (Fixed & Random-effects models).
   - Heterogeneity assessment: Cochran's Q and $I^2$ calculation.
   - Advanced Stats: Subgroup Analysis and Sensitivity Analysis (toggle to remove specific studies and observe impact).
   - Publication Bias: Egger's Test calculation (p-value).

5. PHASE 5: Data Visualization
   - Advanced Forest Plot (with Subgroup totals and Pooled Effect "Diamond").
   - Funnel Plot (with pseudo-95% confidence limit lines).

6. PHASE 6: GRADE Assessment & Export
   - Interactive module for GRADE (Certainty of Evidence) determination.
   - Visual export (PNG/PDF for diagrams/charts) and Data Extraction export (CSV/Excel).