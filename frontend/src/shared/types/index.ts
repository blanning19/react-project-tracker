/**
 * @file Shared domain type re-exports.
 *
 * Types that are consumed by more than one feature (e.g. `home` and
 * `projects`) live in `src/features/projects/models/project.types.ts` as the
 * canonical source of truth, then are re-exported from here so that
 * cross-feature consumers can import from a stable shared path rather than
 * reaching directly into another feature's internals.
 *
 * ### Why not move the types here permanently?
 * The project types originate in the projects feature — that's where the API
 * client, serialiser mappings, and query keys live. Moving the canonical
 * definition here would scatter the domain model from its related code.
 * Re-exporting is the right balance: one canonical definition, one stable
 * public import path for cross-feature use.
 *
 * ### Import guidance
 * - Inside the `projects` feature → import directly from
 *   `../models/project.types`
 * - Outside the `projects` feature (e.g. `home`, `shared/layout`) → import
 *   from `src/shared/types/index.ts` (this file)
 *
 * @module shared/types
 */

export type {
    EmployeeOption,
    ManagerOption,
    PersonOption,
    ProjectFormValues,
    ProjectListParams,
    ProjectRecord,
    ProjectWritePayload,
    PaginatedResponse,
    SecurityLevel,
} from "../../features/projects/models/project.types";
