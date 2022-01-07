#include "io.h"

#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

/*
 * |----|----|----|
 * 0    r    w   cap
 * [r, w)
 * note: w >= r
 */
struct io_rbuffer {
    int fd;
    char *buf;
    size_t cap;
    size_t r;
    size_t w;
};

static int __rbuf_fill(io_rbuffer *rbuf) {
    // guaranteed to read once
    if (rbuf->r > 0) {
        memcpy(rbuf->buf, rbuf->buf + rbuf->r, rbuf->w - rbuf->r);
        rbuf->w -= rbuf->r;
        rbuf->r = 0;
    }
    if (rbuf->w == rbuf->cap - 1) {  // full
        return BUFFER_READ_SUCCESS;
    }
    ssize_t n = recv(rbuf->fd, rbuf->buf, rbuf->cap - rbuf->w, 0);
    if (n == 0) {
        printf("%s\n", strerror(errno));
        return BUFFER_READ_ERROR;
    } else if (n > 0) {
        rbuf->w += n;
        if (n < rbuf->cap - rbuf->w) {
            return BUFFER_READ_HALF;
        }
        return BUFFER_READ_SUCCESS;
    } else {
        if (errno == EAGAIN || errno == EWOULDBLOCK) {
            return BUFFER_READ_HALF;
        }
        printf("%s\n", strerror(errno));
        return BUFFER_READ_ERROR;
    }
}

static ssize_t __rbuf_index(io_rbuffer *rbuf, char delim) {
    for (size_t i = rbuf->r; i < rbuf->w; ++i) {
        if (rbuf->buf[i] == delim) {
            return i;
        }
    }
    return BUFFER_INDEX_NOT_FOUND;
}

io_rbuffer *rbuf_malloc(int fd, int32_t cap) {
    if (cap <= 0) {
        cap = DEFAULT_BUUFER_CAP;
    }
    io_rbuffer *rbuf = (io_rbuffer *)malloc(sizeof(io_rbuffer));
    if (rbuf == NULL) {
        return NULL;
    }
    rbuf->fd = fd;
    rbuf->cap = cap;
    rbuf->buf = (char *)malloc(cap);
    if (rbuf->buf == NULL) {
        free(rbuf);
        return NULL;
    }
    rbuf->r = 0;
    rbuf->w = 0;
    return rbuf;
}

#define CR '\n'

int rbuf_read_line(io_rbuffer *rbuf, void *usrbuf) {
    if (rbuf == NULL || rbuf->buf == NULL) {
        return BUFFER_READ_ERROR;
    }
    ssize_t idx;
    if (rbuf->r != rbuf->w) {
        idx = __rbuf_index(rbuf, CR);
        if (idx != BUFFER_INDEX_NOT_FOUND) {
            memcpy(usrbuf, rbuf->buf + rbuf->r, idx - rbuf->r);
            rbuf->r = idx + 1;
            return BUFFER_READ_SUCCESS;
        }
    }
    int res;
    res = __rbuf_fill(rbuf);
    if (res != BUFFER_READ_SUCCESS) {
        return res;
    }
    idx = __rbuf_index(rbuf, CR);
    if (idx != BUFFER_INDEX_NOT_FOUND) {
        memcpy(usrbuf, rbuf->buf + rbuf->r, idx - rbuf->r);
        rbuf->r = idx + 1;
        return BUFFER_READ_SUCCESS;
    }
    // oversize: return all buffer
    memcpy(usrbuf, rbuf->buf + rbuf->r, rbuf->w - rbuf->r - 1);
    return BUFFER_READ_OVERSIZE;
}

int rbuf_read_bytes(io_rbuffer *rbuf, void *usrbuf, size_t n) {
    if (rbuf == NULL || rbuf->buf == NULL) {
        return BUFFER_READ_ERROR;
    }
    if (rbuf->w - rbuf->r >= n) {
        memcpy(usrbuf, rbuf->buf + rbuf->r, n);
        rbuf->r += n;
        return BUFFER_READ_SUCCESS;
    }
    int res = __rbuf_fill(rbuf);
    if (res != BUFFER_READ_SUCCESS) {
        return res;
    }
    // oversize: return all buffer
    if (n > rbuf->cap) {
        memcpy(usrbuf, rbuf->buf + rbuf->r, rbuf->w - rbuf->r);
        return BUFFER_READ_OVERSIZE;
    }
    memcpy(usrbuf, rbuf->buf + rbuf->r, n);
    rbuf->r += n;
    return BUFFER_READ_SUCCESS;
}

void rbuf_free(io_rbuffer *rbuf) {
    free(rbuf->buf);
    free(rbuf);
    return;
}
