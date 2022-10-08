#include <ayn_core.h>

// 填充buffer
int ayn_buf_fill(struct ayn_buf *rb)
{
	if (rb->r > 0) {
		memcpy(rb->buf, rb->buf + rb->r, rb->w - rb->r);
		rb->w -= rb->r;
		rb->r = 0;
	}
	if (rb->w == rb->size - 1) {
		return 0;
	}
	int n = read(rb->file->fd, rb->buf, rb->size - rb->w);
	if (n > 0) {
		rb->w += n;
		return 0;
	}
	return -1;
}

struct ayn_buf *ayn_malloc(struct ayn_file *file, int size)
{
	struct ayn_buf *rb = malloc(sizeof(struct ayn_buf));
	rb->file = file;
	rb->buf = malloc(size);
	return rb;
}

int ayn_buf_read(struct ayn_buf *rb, int size, char *text)
{
	if (size == 0)
		return 0;
	if (!rb || !rb->buf || !rb->file)
		return 0;
	if (size > rb->size)
		return -1;
	if (rb->w - rb->r >= size) {
		memcpy(text, rb->buf + rb->r, size);
		rb->r += size;
		return 0;
	}
	int ret = ayn_buf_fill(rb);
	if (ret == -1)
		return -1;
	if (rb->w - rb->r >= size) {
		memcpy(text, rb->buf + rb->r, size);
		rb->r += size;
		return size;
	}
	memcpy(text, rb->buf + rb->r, rb->w - rb->r);
	return rb->w - rb->r;
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
