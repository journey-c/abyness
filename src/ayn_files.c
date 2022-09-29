#include <ayn_core.h>

int ayn_open_file(char *filename, int mode, int create, int access)
{
	return open(filename, mode | create, access);
}
