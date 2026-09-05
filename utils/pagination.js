const getSkipAndLimitForPagination = ({ pageNum, pageSize }) => {
    const _pageNumber = pageNum || 1;
    const _pageSize = pageSize || 20;
    const _offset = (_pageNumber - 1) * _pageSize;
    return {
        skip: parseInt(_offset),
        limit: parseInt(_pageSize),
    };
};

module.exports = { getSkipAndLimitForPagination };
