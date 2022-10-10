#include <ayn_core.h>

int ayn_conf_read_token(struct ayn_conf *cf)
{
	struct ayn_buf *buf = cf->conf_file->buffer;
	char ch;
	int n;
	int size;

	for (;;) {
		if (buf->pos >= buf->last) {
			buf->pos = buf->start;
			buf->last = buf->start;
			size = (cf->conf_file->info.st_size -
				cf->conf_file->offset);
			printf("size = %ld offset = %d\n",
			       cf->conf_file->info.st_size,
			       cf->conf_file->offset);
			if (size > buf->end - buf->pos) {
				size = buf->end - buf->pos;
			}
			printf("size = %d\n", size);
			n = ayn_read_file(cf->conf_file, buf->pos, size);
			if (n == 0) {
				printf("EOF\n");
				return 1;
			}
			if (n == -1) {
				printf("read error: %s\n", strerror(errno));
				return -1;
			}
			if (n != size) {
				printf("read half n = %d size = %d\n", n, size);
				return -1;
			}
			buf->last = buf->pos + n;
		}
		ch = *buf->pos++;
		printf("%c", ch);
	}
	return 0;
}

int ayn_conf_parse(struct ayn_conf *cf, char *filename)
{
	struct ayn_file conf_file;
	struct ayn_buf buf;
	int fd;
	int rt;

	if (filename) {
		cf->conf_file = &conf_file;
		fd = ayn_open_file(filename, O_RDONLY, 0, 0);
		if (fd == -1) {
			printf("open error: %s\n", strerror(errno));
			return -1;
		}
		cf->conf_file->fd = fd;
		cf->conf_file->name = filename;
		cf->conf_file->offset = 0;
		if (fstat(fd, &cf->conf_file->info) == -1) {
			printf("stat error: %s\n", strerror(errno));
			return -1;
		}
		cf->conf_file->buffer = &buf;
		buf.start = malloc(AYN_CONF_BUFFER);
		if (buf.start == NULL) {
			printf("malloc error: %s\n", strerror(errno));
			return -1;
		}
		buf.pos = buf.start;
		buf.last = buf.start;
		buf.end = buf.start + AYN_CONF_BUFFER;
	} else if (cf->conf_file->fd != -1) {
	} else {
		return -1;
	}
	for (;;) {
		rt = ayn_conf_read_token(cf);
		if (rt == -1) {
			printf("rt error: %s\n", strerror(errno));
			return -1;
		}
		if (rt == 1) {
			printf("finish\n");
			break;
		}
	}
	return 0;
}
