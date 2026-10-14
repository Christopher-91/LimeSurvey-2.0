# Feature Parity Checklist: Legacy LimeSurvey (PHP) vs Modern Stack (React + Node + PostgreSQL)

This checklist provides a line-by-line audit comparing legacy LimeSurvey capabilities with the newly migrated application.

| Feature Area | Legacy LimeSurvey (PHP) | Modern Architecture (React + Node) | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Setup & Install** | Web installer redirect wizard requiring DB credentials | Automated CLI `npm run db:migrate` and `npm run db:seed` | ✅ Parity Exceeded | Web installer permanently eliminated |
| **Dual-Role Auth** | Admin only web login; separate survey-specific token links | Unified segmented toggle ("Voter Login" & "Admin Login") | ✅ Parity Exceeded | Top-center sliding pill; strict role enforcement |
| **Password Compatibility** | Stored PHP `$2y$` crypt hashes in `lime_users` | Verified via native bcrypt; automatically re-hashed on login | ✅ Complete | Zero user credential disruption |
| **Session Security** | PHP file/DB session cookies | `httpOnly`, `sameSite: lax` JWT cookies with auto-refresh | ✅ Complete | XSS & CSRF hardened |
| **Design System** | `Sea_Green` CSS/SCSS + `fruity_twentythree` Twig | Pure CSS Modules + CSS variables (`design-tokens.css`) | ✅ Complete | Visual parity with LimeSurvey brand |
| **Landing Page** | Public survey list with jumbotron & search | Reactive survey catalog with instant search & direct take | ✅ Complete | Matches LimeSurvey layout |
| **Admin Dashboard** | Box widget layout with quick actions | Sea_Green dashboard with real-time stats & quick links | ✅ Complete | Clean modern summary cards |
| **Survey Creation & Editing** | Multi-screen Yii form | React tabbed survey builder (Settings, Questions, Voters) | ✅ Complete | Live inline updates |
| **Question Types: Single Choice** | List radio (`L`) & Dropdown (`!`) | Accessible radio card groups | ✅ Complete | Core question type |
| **Question Types: Multiple Choice** | Multi-checkbox (`M`) | Multi-select checkbox groups | ✅ Complete | Core question type |
| **Question Types: Rating** | 5-point choice (`5`) | Interactive 5-star rating scale | ✅ Complete | Core question type |
| **Question Types: Text** | Short text (`S`) & Long text (`T`) | Single-line and textarea inputs | ✅ Complete | Core question type |
| **Question Types: Yes/No** | Radio Yes/No (`Y`) | Button toggle switch | ✅ Complete | Core question type |
| **Question Types: Numerical & Date** | Numerical (`N`) & Date (`D`) | Validated number & HTML5 date pickers | ✅ Complete | Core question type |
| **Question Types: Matrix / Array** | Matrix (`F`, `A`, `B`, `C`) | — | ⏳ Backlog Phase A | Schema supports via JSON subquestions |
| **Question Types: File Upload** | File upload (`\|`) | — | ⏳ Backlog Phase B | S3/Storage upload plugin |
| **Response Storage** | Dynamic per-survey DDL tables (`lime_survey_{sid}`) | Unified PostgreSQL `responses` table with `JSONB` | ✅ Parity Exceeded | Schema safety, faster GIN indexing |
| **Response Validation** | PHP ExpressionManager validations | Zod schema + client/server mandatory verification | ✅ Complete | Immediate inline validation error |
| **Participant / Voter Tokens** | Per-survey token tables (`lime_tokens_{sid}`) | Unified `voters` table with auto batch token generator | ✅ Complete | Single-use and validity dates enforced |
| **Statistics & Aggregation** | PHP Chart.js & tablesorter | Real-time percentage distribution bars & score averages | ✅ Complete | Instant calculation |
| **Data Export** | `php_xlsxwriter` & CSV output | Native `xlsx` library with direct CSV / XLSX downloads | ✅ Complete | Formatted columns with question labels |
| **API Documentation** | XML-RPC / JSON-RPC / OpenApi script | Interactive Swagger UI at `/api/docs` | ✅ Complete | OpenAPI 3.0 specification |
| **Legacy DB Migration** | Manual DB dumps | `npm run db:import-legacy` CLI script | ✅ Complete | Reads old PostgreSQL `lime_*` tables |

---

## 📋 Backlog for Future Enhancements (Phase A & B)
1. **Matrix / Array Question Types**: Dual-scale evaluation matrices for complex psychological surveys.
2. **Survey Quotas**: Limiting responses by demographic attributes or completion caps.
3. **Multi-language Survey Translations**: Extending `SurveyLanguageSetting` to support dynamic on-the-fly survey translation.
4. **Email Reminders & Invitations**: Automated SMTP email dispatching to registered participant tokens.
5. **ExpressionScript**: Advanced conditional branching equations between question groups.
