#ifndef _AYN_FILES_H_INCLUDE_
#define _AYN_FILES_H_INCLUDE_

struct stat;

struct ayn_file {
	int fd;
	char *name;
	struct stat *info;
};

int ayn_open_file(char *filename, int mode, int create, int access);
int ayn_stat_file();

int ayn_read_file(struct ayn_file *file);

#endif /* _AYN_FILES_H_INCLUDE_ */
