#include <ayn_core.h>

struct ayn_log default_log;

struct ayn_log *ayn_log_init(char *prefix, char *error_log)
{
	default_log.log_level = 0;
	return &default_log;
};

// errno加到最后
int ayn_log_stderr(int errno, const char *fmt, ...)
{
	char errstr[AYN_LOG_MAX_ERROR_STR];
	char *p, *last;
	va_list args;

	p = errstr;
	last = errstr + AYN_LOG_MAX_ERROR_STR;
	va_start(args, fmt);
	p = ayn_vsprintf(p, last, fmt, args);
	va_end(args);
	/* sprintf(msg, "(%d: %s)", errno, strerror(errno)); */

	return write(STDERR_FILENO, errstr, sizeof(errstr));
}

int ayn_write_stderr(char *text)
{
	return write(STDERR_FILENO, text, strlen(text));
};
