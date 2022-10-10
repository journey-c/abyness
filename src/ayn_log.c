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
	int d;
    unsigned int u;
    double f;
	char *s;
	char c;
	int64_t i64;

	char errstr[AYN_LOG_MAX_ERROR_STR];
	va_list args;

	va_start(args, fmt);
	/* arg = va_arg(args, char *); */
	/* printf("%s\n", arg); */
	va_end(args);
	/* sprintf(msg, "(%d: %s)", errno, strerror(errno)); */

	return write(STDERR_FILENO, errstr, 0);
}

int ayn_write_stderr(char *text)
{
	return write(STDERR_FILENO, text, strlen(text));
};
