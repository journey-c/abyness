#ifndef _AYN_CONFIG_H_INCLUDE_
#define _AYN_CONFIG_H_INCLUDE_

struct ayn_server {
	char **servernames;
};

struct ayn_app {
	struct ayn_server **servers;
};

struct ayn_transport {
	int **listeners;
	struct ayn_app **apps;
};

struct ayn_config {
	struct ayn_transport **transports;
};

void ayn_conf_parse(struct ayn_config *cf, char *filename);

#endif /* _AYN_CONFIG_H_INCLUDE_ */
