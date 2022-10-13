#include <ayn_core.h>

struct va_list;

char *ayn_vsprintf(char *buf, char *last, const char *fmt, va_list args)
{
	int align_left;
	int plus;
	char fill_ch;
	int space;
	int sharp;
	int width;
	int precision;
	int int_w;

	long long _i;
	char _c;
	char *_s;
	long double _f;
	// %[flags][width][.precision][length]specifier
	while (*fmt && buf < last) {
		if (*fmt == '%') {
			align_left = 0;
			plus = 0;
			fill_ch = ' ';
			space = 0;
			sharp = 0;
			width = 0;
			precision = 1;
			int_w = 0;
			// flags
			switch (*++fmt) {
			case '-':
				align_left = 1;
				++fmt;
				break;
			case '+':
				plus = 1;
				++fmt;
				break;
			case ' ':
				space = 1;
				while (*fmt == ' ' &&
				       buf < last) // 去除多余空格
					++fmt;
				break;
			case '#':
				sharp = 1;
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
			switch (*fmt) {
			case 'h':
				int_w = 2;
				++fmt;
				break;
			case 'l':
				int_w = 4;
				++fmt;
				break;
			case 'L':
				int_w = 8;
				++fmt;
				break;
			default:
				break;
			}
			// specifier
			switch (*fmt) {
			// case 'a':
			// case 'A':
			// 十六进制浮点数
			// break;
			case 'd':
				_i = va_arg(args, int);
				break;
			case 'o':
				_i = va_arg(args, int);
				break;
			case 'x':
			case 'X':
				break;
			case 'u':
				break;
			case 'f':
				break;
			case 'e':
			case 'E':
				break;
			case 'c':
				break;
			case 's':
				break;
			case 'p':
				break;
			default:
				break;
			}
		} else {
			*buf++ = *fmt++;
		}
	}
	return buf;
}
