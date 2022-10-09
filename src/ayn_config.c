#include "ayn_buf.h"
#include <ayn_core.h>

int ayn_conf_parse(struct ayn_conf *cf, char *filename)
{
	struct ayn_file conf_file;
	struct ayn_buf buf;

	if (filename) {
		cf->conf_file = &conf_file;
		int fd = ayn_open_file(filename, O_RDONLY, 0, 0);
		if (fd == -1) {
			return -1;
		}
		cf->conf_file->fd = fd;
		cf->conf_file->name = filename;
		if (fstat(fd, cf->conf_file->info) == -1) {
			return -1;
		}
		buf.start = (char *)malloc(AYN_CONF_BUFFER);
		buf.pos = buf.start;
		buf.last = buf.start;
		buf.end = buf.start + AYN_CONF_BUFFER;
	} else if (cf->conf_file->fd != -1) {
	} else {
		return -1;
	}
	for (;;) {
	}
	return 0;
}
