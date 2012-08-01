# hackernews-tools

This is some work-in-progress code for parsing
[Hacker News](http://news.ycombinator.com) in the absence of a useful API for
downloading comments/submissions.

The code is likely brittle and not broadly applicable, but if you want to use
it you'll need:

* a PostgreSQL database with schema from **docs/schema.sql**
* a configuration file **config.json** based on **docs/config.json** with the
   database credentials and the list of users you want to follow

Then, run the job out of cron, thus:

```
0,30 * * * * $HOME/proj/hackernews-tools/watcher.js
```

If everything goes well, you'll get e-mails that contain text-only,
hard-wrapped renderings of the comments left by the users you're watching.
