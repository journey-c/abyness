#include <ayn_core.h>

struct ayn_buf *ayn_malloc(int fd, int size)
{
	struct ayn_buf *rb = malloc(sizeof(struct ayn_buf));
	rb->buf = malloc(size);
	return rb;
}

int ayn_buf_read_n(struct ayn_buf *rb, int size, char *text)
{
    if (size == 0) {
        return 0;
    }
	return 0;
}

int ayn_buf_read_line(struct ayn_buf *rb, char *text)
{
	return 0;
}

int ayn_buf_read_bytes(struct ayn_buf *rb, char delim, char *text)
{
	return 0;
}

void ayn_buf_free(struct ayn_buf *rb)
{
	if (!rb) {
		return;
	}
	if (rb->buf) {
		free(rb->buf);
	}
	free(rb);
}
