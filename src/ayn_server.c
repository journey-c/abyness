#include <ayn_core.h>

struct listener {
	int listen_fd;
};

struct ayn_server {
	struct listeners **listener;
};
