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
    const log = await git.log({
      '--max-count': 50, // Son 50 commit'i getir
    });
    return log.all;
  } catch (error) {
    console.error('Git geçmişi alınırken hata oluştu:', error);
    return [];
  }
}

export async function commitContentChange({ action, fileType, slug, user }: CommitDetails) {
  try {
    const status = await git.status();
    if (status.files.length === 0) {
      console.log("Commit atılacak bir değişiklik bulunamadı.");
      return;
    }

    const actionVerb = {
      create: 'Oluştur',
      update: 'Güncelle',
      delete: 'Sil',
    }[action];

    const commitMessage = `feat(content): ${fileType} '${slug}' ${actionVerb} (${user}) [ci skip]`;

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
    // Revert işlemini de commit'lemek iyi bir pratik olabilir, ancak simple-git bunu zaten yapıyor.
    // Değişiklikleri yansıtmak için revalidate gerekebilir.
  } catch (error) {
    console.error(`Commit ${hash} geri alınırken hata oluştu:`, error);
    await git.raw('revert', '--abort');
    throw new Error('Commit geri alınamadı. Muhtemelen bir çakışma (conflict) oluştu.');
  }
}