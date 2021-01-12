#ifndef _MAP_H_
#define _MAP_H_

typedef struct map map;

extern map * map_new(char *err, int (*cmp)(void *, void *));
extern int map_add(char *err, map *m, void *key, void *val);
extern void map_remove(char *err, map *m, void *key);
extern void *map_lookup(char *err, map *m, void *key);
extern void map_range(map *m, void(func)(map *m, void *key, void *val));
extern void map_free(map *m);

#endif /* _MAP_H_ */
