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

export async function commitContentChange({ action, fileType, slug, user }: CommitDetails) {
  try {
    // Check if there are any changes
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
    // Gerçek dünya senaryosunda, bu hatayı daha zarif bir şekilde ele almak isteyebilirsiniz.
    // Şimdilik sadece hatayı logluyoruz.
    throw new Error('Commit işlemi başarısız oldu.');
  }
}
