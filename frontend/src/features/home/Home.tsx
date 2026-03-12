/**
 * @file Home page wiring component.
 *
 * @module home/Home
 */

import HomeView from "./HomeView";
import { useHomeController } from "./useHomeController";

/**
 * Wires the grouped controller contract into the current flat HomeView prop contract.
 *
 * @returns The rendered Home page.
 */
function Home(): JSX.Element {
    const {
        rows,
        pagination,
        filters,
        sort,
        state,
        actions,
        navigation,
    } = useHomeController();

    return (
        <HomeView
            projects={rows}
            totalCount={pagination.total}
            currentPage={pagination.page}
            pageSize={pagination.pageSize}
            loading={state.loading}
            apiError={state.apiError}
            successMessage=""
            search={filters.searchTerm}
            statusFilter={filters.statusFilter}
            sortKey={sort.key}
            sortDesc={sort.dir === "desc"}
            onSearchChange={filters.onSearchChange}
            onStatusFilterChange={filters.onStatusFilterChange}
            onSortChange={sort.toggleSort}
            onPageChange={pagination.onPageChange}
            onDeleteClick={navigation.onDeleteRequest}
            onRetry={actions.getData}
            deleteTarget={navigation.deleteTarget}
            onDeleteCancel={navigation.onDeleteCancel}
            onDeleteConfirm={navigation.onDeleteConfirm}
            deleteError=""
            deleteLoading={false}
            onCreateClick={navigation.onNavigateCreate}
            onEditClick={navigation.onNavigateEdit}
        />
    );
}

export default Home;