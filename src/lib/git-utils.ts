import simpleGit from 'simple-git';
import path from 'path';

const portfolioDir = path.resolve(process.cwd());
const git = simpleGit(portfolioDir);

type CommitDetails = {
  action: 'create' | 'update' | 'delete';
  fileType: string;
  slug: string;
  user: string;
};

export async function getCommitHistory() {
  try {
    const log = await git.log({ '--max-count': 50 });
    return log.all;
  } catch (error) {
    console.error('Git geçmişi alınırken hata oluştu:', error);
    return [];
  }
}

export async function getGitRepoUrl(): Promise<string | null> {
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find(remote => remote.name === 'origin');
    if (origin && origin.refs.fetch) {
      return origin.refs.fetch.replace(/^git@github.com:/, 'https://github.com/').replace(/\.git$/, '');
    }
    return null;
  } catch (error) {
    console.error('Git repo URL alınırken hata oluştu:', error);
    return null;
  }
}

export async function commitContentChange({ action, fileType, slug, user }: CommitDetails) {
  try {
    const status = await git.status();
    if (status.files.length === 0) {
      console.log("Commit atılacak bir değişiklik bulunamadı.");
      return;
    }
    const actionMap = { create: 'oluşturuldu', update: 'güncellendi', delete: 'silindi' };
    const actionVerb = actionMap[action];
    const typeTR = fileType.replace('projects', 'proje').replace('blog', 'yazı');
    const commitMessage = `içerik: '${slug}' adlı ${typeTR} ${user} tarafından ${actionVerb}. [ci skip]`;
    await git.add('.');
    await git.commit(commitMessage);
    console.log(`Commit başarıyla atıldı: ${commitMessage}`);
  } catch (error) {
    console.error('İçerik değişiklikleri commitlenirken bir hata oluştu:', error);
    throw new Error('Commit işlemi başarısız oldu.');
  }
}

export async function revertCommit(hash: string, user: string) {
  try {
    await git.revert(hash, ['--no-edit']);
    console.log(`Commit ${hash} başarıyla geri alındı.`);
  } catch (error) {
    console.error(`Commit ${hash} geri alınırken hata oluştu:`, error);
    await git.raw('revert', '--abort');
    throw new Error('Commit geri alınamadı. Muhtemelen bir çakışma (conflict) oluştu.');
  }
}

export async function commitAllChanges(message: string, user: string) {
  try {
    const status = await git.status();
    if (status.files.length === 0) {
      throw new Error("Commit atılacak bir değişiklik bulunamadı.");
    }
    const commitMessage = `kaynak: ${message} (${user}) [ci skip]`;
    await git.add('.');
    await git.commit(commitMessage);
    console.log(`Tüm değişiklikler başarıyla commit'lendi: ${commitMessage}`);
    return { success: true, message: "Tüm değişiklikler başarıyla commit'lendi." };
  } catch (error) {
    console.error('Tüm değişiklikler commitlenirken bir hata oluştu:', error);
    throw new Error((error as Error).message || 'Commit işlemi başarısız oldu.');
  }
}