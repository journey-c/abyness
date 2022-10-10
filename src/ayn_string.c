#include <ayn_core.h>

struct va_list;

char *ayn_vsprintf(char *buf, char *last, const char *fmt, va_list args)
{
	int align_left;
	int sign;
	// %[flags][width][.precision][length]specifier
	while (*fmt && buf < last) {
		if (*fmt == '%') {
			// flags
			switch (*++fmt) {
			case '-':
				align_left = 1;
			case '+':
				sign = 1;
			case ' ':
			case '#':
			case '0':

			default:
				break;
			}

		} else {
			*buf++ = *fmt++;
		}
	}
	return buf;
}
