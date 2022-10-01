#ifndef _AYN_BUF_H_INCLUDE_
#define _AYN_BUF_H_INCLUDE_

#define AYN_BUFFER_READ_SUCCESS 0
#define AYN_BUFFER_READ_EOF 1
#define AYN_BUFFER_READ_HALF 2
#define AYN_BUFFER_READ_OVERSIZE 3
#define AYN_BUFFER_READ_ERROR -1
#define BUFFER_INDEX_NOT_FOUND -1

#define DEFAULT_BUUFER_CAP 4096

struct ayn_buf {
	char *buf;
	int fd;
	int size;
	int r;
	int w;
};

struct ayn_buf *ayn_malloc(int fd, int size);
int ayn_buf_read_n(struct ayn_buf *rb, int size, char *text);
int ayn_buf_read_line(struct ayn_buf *rb, char *text);
int ayn_buf_read_bytes(struct ayn_buf *rb, char delim, char *text);
void ayn_buf_free(struct ayn_buf *rb);

#endif /* _AYN_BUF_H_INCLUDE_ */
