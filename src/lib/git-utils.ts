import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';

const portfolioDir = path.resolve(process.cwd());
const git: SimpleGit = simpleGit(portfolioDir);

type CommitDetails = {
  action: 'create' | 'update' | 'delete';
  fileType: string;
  slug: string;
  user: string;
};

/**
 * GitHub kimlik bilgileriyle donatılmış, kimliği doğrulanmış bir uzak depo URL'si oluşturur.
 * @returns Kimliği doğrulanmış URL veya hata durumunda null.
 */
async function getAuthenticatedRepoUrl(): Promise<string> {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;

  if (!username || !token) {
    throw new Error('GitHub kullanıcı adı veya token .env.local dosyasında tanımlanmamış. Lütfen GITHUB_USERNAME ve GITHUB_TOKEN değişkenlerini ekleyin.');
  }

  const remotes = await git.getRemotes(true);
  const origin = remotes.find(remote => remote.name === 'origin');
  if (!origin) {
    throw new Error('"origin" adında bir uzak depo bulunamadı.');
  }

  // Mevcut URL'den protokolü (https://) kaldırarak temiz bir URL elde et
  const repoUrl = origin.refs.fetch.replace(/^https?:\/\//, '');
  
  return `https://${username}:${token}@${repoUrl}`;
}

/**
 * Değişiklikleri kimliği doğrulanmış uzak depoya gönderir.
 */
async function pushChanges() {
  try {
    const authenticatedUrl = await getAuthenticatedRepoUrl();
    // 'main' veya projenizin ana branch'inin adını kullanın
    await git.push(authenticatedUrl, 'main'); 
    console.log('Değişiklikler başarıyla GitHub\'a gönderildi.');
  } catch (error: any) {
    console.error('GitHub\'a push işlemi sırasında kritik bir hata oluştu:', error.message);
    if (error.message.includes('authentication failed')) {
      throw new Error('GitHub kimlik doğrulaması başarısız oldu. GITHUB_USERNAME veya GITHUB_TOKEN .env.local dosyasında yanlış olabilir.');
    }
    throw new Error(`Değişiklikler commit'lendi ancak GitHub'a gönderilemedi: ${error.message}`);
  }
}

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
    if (origin?.refs.fetch) {
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
    if (status.files.length === 0) return;
    
    const actionMap = { create: 'oluşturuldu', update: 'güncellendi', delete: 'silindi' };
    const commitMessage = `içerik: '${slug}' adlı ${fileType} ${user} tarafından ${actionMap[action]}. [ci skip]`;
    
    await git.add('.');
    await git.commit(commitMessage);
    await pushChanges();
  } catch (error) {
    throw new Error(`İçerik değişikliği işlenemedi: ${(error as Error).message}`);
  }
}

export async function revertCommit(hash: string, user: string) {
  try {
    await git.revert(hash, ['--no-edit']);
    await pushChanges();
  } catch (error) {
    await git.raw('revert', '--abort').catch(abortError => console.error("Revert abort hatası:", abortError));
    throw new Error(`Commit geri alınamadı: ${(error as Error).message}`);
  }
}

export async function commitAllChanges(message: string, user: string) {
  try {
    const status = await git.status();
    if (status.files.length === 0) throw new Error("Commit atılacak bir değişiklik bulunamadı.");
    
    const commitMessage = `kaynak: ${message} (${user}) [ci skip]`;
    
    await git.add('.');
    await git.commit(commitMessage);
    await pushChanges();
    
    return { success: true, message: "Tüm değişiklikler başarıyla commit'lendi ve GitHub'a gönderildi." };
  } catch (error) {
    throw new Error(`Kaynak kodları işlenemedi: ${(error as Error).message}`);
  }
}

export async function testGitConnection(): Promise<{ok: boolean; message: string}> {
    try {
        // Sadece kimlik bilgilerinin varlığını ve uzak depo URL'sinin alınabildiğini kontrol et
        await getAuthenticatedRepoUrl();
        // Basit bir git komutu çalıştırarak bağlantıyı doğrula
        await git.listRemote(['--heads']);
        return { ok: true, message: 'GitHub bağlantısı ve kimlik bilgileri doğru.' };
    } catch (error: any) {
        console.error("GitHub bağlantı testi başarısız:", error.message);
        // Hata mesajını olduğu gibi döndürerek kullanıcıya daha fazla bilgi ver
        return { ok: false, message: error.message };
    }
}
