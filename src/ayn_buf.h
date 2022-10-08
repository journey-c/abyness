#ifndef _AYN_BUF_H_INCLUDE_
#define _AYN_BUF_H_INCLUDE_

#define AYN_BUFFER_READ_SUCCESS 0
#define AYN_BUFFER_READ_EOF 1
#define AYN_BUFFER_READ_HALF 2
#define AYN_BUFFER_READ_OVERSIZE 3
#define AYN_BUFFER_READ_ERROR -1
#define BUFFER_INDEX_NOT_FOUND -1

#define DEFAULT_BUUFER_SIZE 4096

struct ayn_file;

struct ayn_buf {
	char *buf;
	struct ayn_file *file;
	int size;
	int r;
	int w;
};

struct ayn_buf *ayn_malloc(struct ayn_file *file, int size);
int ayn_buf_read(struct ayn_buf *rb, int size, char *text);
void ayn_buf_free(struct ayn_buf *rb);

#endif /* _AYN_BUF_H_INCLUDE_ */
