#include <ayn_core.h>

int ayn_write_stdout(char *text)
{
	return write(STDOUT_FILENO, text, strlen((const char *)text));
}

int ayn_write_stderr(char *text)
{
	return write(STDERR_FILENO, text, strlen((const char *)text));
}
