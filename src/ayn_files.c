#include "ayn_log.h"
#include <ayn_core.h>

int ayn_open_file(char *filename, int mode, int create, int access)
{
	return open(filename, mode | create, access);
}

int ayn_read_file(struct ayn_file *file, char *buf, int size)
{
	int n;
	n = read(file->fd, buf, size);
	if (n == -1) {
		printf("read error %s\n", strerror(errno));
		return -1;
	}
	file->offset += n;
	return n;
}
