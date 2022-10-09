#ifndef _AYN_BUF_H_INCLUDE_
#define _AYN_BUF_H_INCLUDE_

struct ayn_file;

struct ayn_buf {
	char *start;
	char *end;
	char *pos;
	char *last;
};

#endif /* _AYN_BUF_H_INCLUDE_ */
