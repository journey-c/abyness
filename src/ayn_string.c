#include <ayn_core.h>

struct va_list;

char *ayn_vsprintf(char *buf, char *last, const char *fmt, va_list args)
{
	int align_left;
	int sign;
	char fill_ch;
	int space;
	int prefix;
	int width;
	int precision;
	// %[flags][width][.precision][length]specifier
	while (*fmt && buf < last) {
		if (*fmt == '%') {
			align_left = 0;
			sign = 0;
			fill_ch = ' ';
			space = 0;
			prefix = 0;
			width = 0;
			precision = 1;
			// flags
			switch (*++fmt) {
			case '-':
				align_left = 1;
				++fmt;
				break;
			case '+':
				sign = 1;
				++fmt;
				break;
			case ' ':
				space = 1;
				while (*fmt == ' ' &&
				       buf < last) // 去除多余空格
					++fmt;
				break;
			case '#':
				prefix = 1;
				++fmt;
				break;
			case '0':
				fill_ch = '0';
				++fmt;
				break;
			default:
				break;
			}
			// width
			if (*fmt == '*') {
				width = va_arg(args, int);
				++fmt;
			}
			if (!width)
				while (*fmt >= '0' && *fmt <= '9') {
					width *= 10;
					width += *fmt - '0';
					++fmt;
				}
			// precision
			if (*fmt == '.') {
				if (*++fmt == '*') {
					precision = va_arg(args, int);
					++fmt;
				}
				if (!precision) {
					while (*fmt >= '0' && *fmt <= '9') {
						precision *= 10;
						precision += *fmt - '0';
						++fmt;
					}
				}
			}
            // length

            // specifier
		} else {
			*buf++ = *fmt++;
		}
	}
	return buf;
}
