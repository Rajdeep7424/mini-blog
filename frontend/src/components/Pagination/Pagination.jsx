import styles from './Pagination.module.css';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, hasNextPage, hasPrevPage, nextPage, prevPage } = pagination;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageButton} ${i === currentPage ? styles.active : ''}`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className={styles.navButton}
      >
        First
      </button>
      
      <button
        onClick={() => handlePageChange(prevPage)}
        disabled={!hasPrevPage}
        className={styles.navButton}
      >
        Previous
      </button>

      {renderPageNumbers()}

      <button
        onClick={() => handlePageChange(nextPage)}
        disabled={!hasNextPage}
        className={styles.navButton}
      >
        Next
      </button>
      
      <button
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={styles.navButton}
      >
        Last
      </button>

      <span className={styles.pageInfo}>
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

export default Pagination;