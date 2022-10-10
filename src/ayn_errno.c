#include <ayn_core.h>

/* static char *ayn_unknown_error = "Unknown error"; */

char *ngx_sys_errlist;
int ayn_first_error;
int ayn_last_error;

int ayn_errno_init()
{
	int err;
	char *msg;
	ayn_first_error = 0;
	for (err = 0; err < 1000; ++err) {
		errno = 0;
		msg = strerror(err);
		if (errno == EINVAL || msg == NULL ||
		    strncmp(msg, "Unknown error", 13) == 0) {
			continue;
		}
		ayn_last_error = err + 1;
	}
	return 0;
}
