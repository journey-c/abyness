/*
 * socket I/O buffer
 */
#ifndef _IO_H_
#define _IO_H_

#include <stdint.h>
#include <stdlib.h>

#define BUFFER_READ_SUCCESS 0
#define BUFFER_READ_EOF 1
#define BUFFER_READ_HALF 2
#define BUFFER_READ_OVERSIZE 3
#define BUFFER_READ_ERROR -1

#define BUFFER_INDEX_NOT_FOUND -1

#define DEFAULT_BUUFER_CAP 4096

typedef struct io_rbuffer io_rbuffer;

extern io_rbuffer *rbuf_malloc(int, int32_t);
extern int rbuf_read_line(io_rbuffer *, void *);
extern int rbuf_read_bytes(io_rbuffer *, void *, size_t);
extern void rbuf_free(io_rbuffer *);

#endif /* _IO_ */
