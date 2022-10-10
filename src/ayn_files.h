#ifndef _AYN_FILES_H_INCLUDE_
#define _AYN_FILES_H_INCLUDE_

struct stat;

struct ayn_file {
	int fd;
	char *name;
	int offset;
	struct stat info;
	struct ayn_buf *buffer;
};

int ayn_open_file(char *filename, int mode, int create, int access);
int ayn_read_file(struct ayn_file *file, char *buf, int size);

#endif /* _AYN_FILES_H_INCLUDE_ */
