#include <ayn_core.h>

void ayn_conf_parse(struct ayn_conf *cf, char *filename)
{
	if (filename) {
		int fd = ayn_open_file(filename, 0, 0, 0);
		if (fd == -1) {
			exit(-1);
		}
	}
	return;
}
