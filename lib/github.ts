import { Octokit } from "octokit";

const OWNER = "shalaball";
const REPO = "art-gallery";

function getOctokit() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  return new Octokit({ auth: token });
}

export async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path,
  });
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`${path} is not a file`);
  }
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function getFileSha(path: string): Promise<string | null> {
  try {
    const { sha } = await getFileContent(path);
    return sha;
  } catch {
    return null;
  }
}

// Commit multiple files atomically using the Git Trees API
export async function commitFiles(
  files: { path: string; content: string | Buffer }[],
  message: string
) {
  const octokit = getOctokit();

  // Get the latest commit SHA on master
  const { data: ref } = await octokit.rest.git.getRef({
    owner: OWNER,
    repo: REPO,
    ref: "heads/master",
  });
  const latestCommitSha = ref.object.sha;

  // Get the tree SHA of the latest commit
  const { data: commit } = await octokit.rest.git.getCommit({
    owner: OWNER,
    repo: REPO,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commit.tree.sha;

  // Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const isBuffer = Buffer.isBuffer(file.content);
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: isBuffer
          ? (file.content as Buffer).toString("base64")
          : file.content as string,
        encoding: isBuffer ? "base64" : "utf-8",
      });
      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  // Create a new tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // Create a new commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update the reference
  await octokit.rest.git.updateRef({
    owner: OWNER,
    repo: REPO,
    ref: "heads/master",
    sha: newCommit.sha,
  });

  return newCommit.sha;
}

// Delete a file from the repo
export async function deleteFile(path: string, message: string) {
  const octokit = getOctokit();
  const sha = await getFileSha(path);
  if (!sha) throw new Error(`File not found: ${path}`);

  await octokit.rest.repos.deleteFile({
    owner: OWNER,
    repo: REPO,
    path,
    message,
    sha,
  });
}
