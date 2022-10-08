#include <ayn_core.h>

int ayn_conf_parse(struct ayn_conf *cf, char *filename)
{
	struct ayn_file *file = malloc(sizeof(struct ayn_file));
	struct ayn_buf *rbuf;

	if (filename) {
		int fd = ayn_open_file(filename, O_RDONLY, 0, 0);
		if (fd == -1) {
			return -1;
		}
		file->fd = fd;
		file->name = filename;
		if (fstat(fd, file->info) == -1) {
			free(file);
			return -1;
		}
		rbuf = ayn_malloc(file, DEFAULT_BUUFER_SIZE);
		char *line = malloc(DEFAULT_BUUFER_SIZE);
		for (;;) {
			int ret = ayn_buf_read(rbuf, 0, line);
			if (ret == -1) {
				return -1;
			}
			ayn_write_stdout(line);
		}
	}
	return 0;
}
