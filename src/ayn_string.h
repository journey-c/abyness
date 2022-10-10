#ifndef _AYN_STRING_H_INCLUDE_
#define _AYN_STRING_H_INCLUDE_

/* #ifndef _VA_LIST */
typedef __builtin_va_list va_list;
/* #define _VA_LIST */
/* #endif */

char *ayn_vsprintf(char *buf, char *last, const char *fmt, va_list args);

#endif /* _AYN_STRING_H_INCLUDE_ */
