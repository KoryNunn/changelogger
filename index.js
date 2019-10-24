#!/usr/bin/env node

var stdin = process.openStdin();

var input = "";

stdin.on('data', function(chunk) {
  input += chunk;
});

var matchVersion = /^(\d+\.\d+\.\d+)$/;
var matchMessage = /^\s\s\s\s(.*)/;
var matchCommit = /^commit (.*)$/;
var matchAuthor = /^Author: (.*) <.*$/;
var matchDate = /^Date:\s+(\w{3} \w{3} \d+) .*? (\d{4}).*$/;

function getCommits(data){
    var lines = data.split(/\n/)
        .filter(line => !line.match(
            /(?:Merge .*)|(?:Update README\.md)/
        ));
    var commits = [];
    var currentCommit;

    function initCommit(){
        currentCommit = {};
    }

    initCommit();
    while(lines.length){
        var line = lines.pop();
        var commitMatch = line.match(matchCommit);
        var authorMatch = line.match(matchAuthor);
        var messageMatch = line.match(matchMessage);
        var dateMatch = line.match(matchDate);

        if(commitMatch){
            currentCommit.commit = commitMatch[1];
            commits.push(currentCommit);
            initCommit()
            continue;
        }

        if(authorMatch){
            currentCommit.author = authorMatch[1];
            continue;
        }

        if(messageMatch){
            currentCommit.message = messageMatch[1];
            continue;
        }

        if(dateMatch){
            currentCommit.date = dateMatch[1] + ' ' + dateMatch[2]
            continue
        }
    }

    return commits
}

function createCommitLink(commit){
    return `[${commit.commit.slice(0, 8)}](${commit.author}@${commit.commit})`
}

function format(){
    var commits = getCommits(input)
        .filter(commit => commit.message);
    var releases = [];
    var currentRelease

    function initRelease(){
        currentRelease = {
            changes: []
        };
    }

    initRelease()
    while(commits.length){
        var commit = commits.shift();
        var versionMatch = commit.message.match(matchVersion);
        if(versionMatch){
            currentRelease.version = versionMatch[1]
            currentRelease.date = commit.date;
            releases.push(currentRelease);
            initRelease();
            continue;
        }

        currentRelease.changes.push(`${commit.message} - ${createCommitLink(commit)}`);
    }

    var output = releases.reduce(function(result, release){
        return (
`
## ${release.version} - ${release.date}

${release.changes.join('\n\n')}

${result}`
        )
    }, '')

    console.log(output)
}

stdin.on('end', format);