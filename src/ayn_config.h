#ifndef _AYN_CONFIG_H_INCLUDE_
#define _AYN_CONFIG_H_INCLUDE_

#define AYN_TRANSPORT_TCP "TCP"
#define AYN_TRANSPORT_UDP "UDP"

#define AYN_CONF_BUFFER 4096

struct ayn_conf_location {
	char *name;
	int(parsehandler);
};

struct ayn_vserver {
	char **servernames;

	int(parsehandler);
};

struct ayn_conf_app {
	char *proto;
	struct ayn_vserver **vservers;

	int(parsehandler);
};

struct ayn_conf_transport {
	char *proto;
	char *listener;

	struct ayn_conf_app **apps;

	int(parsehandler);
};

struct ayn_conf {
	struct ayn_file *conf_file;

	struct ayn_conf_transport **transports;

	int(parsehandler);
};

int ayn_conf_parse(struct ayn_conf *cf, char *filename);

#endif /* _AYN_CONFIG_H_INCLUDE_ */
