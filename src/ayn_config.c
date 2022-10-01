#include <ayn_core.h>

int ayn_conf_parse(struct ayn_conf *cf, char *filename)
{
	cf->file = malloc(sizeof(struct ayn_file));
	if (filename) {
		int fd = ayn_open_file(filename, O_RDONLY, 0, 0);
		if (fd == -1) {
			return -1;
		}
		if (fstat(fd, cf->file->info) == -1) {
			return -1;
		}
	}
	return 0;
}
