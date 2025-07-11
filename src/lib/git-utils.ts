/**
 * @file Git işlemleri için yardımcı fonksiyonlar.
 * @description Bu modül, simple-git kütüphanesini kullanarak Git deposuyla ilgili tüm işlemleri yönetir.
 *              Commit atma, değişiklikleri gönderme, geçmişi alma gibi temel Git operasyonlarını içerir.
 */

import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import path from 'path';

// Proje kök dizinini temel alarak simple-git'i başlat
const portfolioDir = path.resolve(process.cwd());
const options: Partial<SimpleGitOptions> = {
  baseDir: portfolioDir,
  binary: 'git',
  maxConcurrentProcesses: 6,
};
const git: SimpleGit = simpleGit(options);

/**
 * Commit işlemi için gerekli olan detayları tanımlar.
 */
type CommitDetails = {
  action: 'create' | 'update' | 'delete';
  fileType: string;
  slug: string;
  user: string;
};

/**
 * GitHub kimlik bilgileriyle donatılmış, doğrulanmış bir uzak depo URL'si oluşturur.
 * Bu fonksiyon, .env.local dosyasındaki GITHUB_USERNAME ve GITHUB_TOKEN değişkenlerini kullanır.
 * @returns {Promise<string>} Kimliği doğrulanmış depo URL'si.
 * @throws {Error} Gerekli ortam değişkenleri veya 'origin' remote'u bulunamazsa hata fırlatır.
 */
async function getAuthenticatedRepoUrl(): Promise<string> {
  const username = process.env.GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;

  if (!username || !token) {
    console.error("getAuthenticatedRepoUrl -> Hata: Gerekli GitHub kimlik bilgileri .env.local dosyasında eksik.");
    throw new Error('GitHub kullanıcı adı veya token .env.local dosyasında tanımlanmamış. Lütfen GITHUB_USERNAME ve GITHUB_TOKEN değişkenlerini ekleyin.');
  }

  const remotes = await git.getRemotes(true);
  const origin = remotes.find(remote => remote.name === 'origin');
  if (!origin) {
    console.error("getAuthenticatedRepoUrl -> Hata: 'origin' adında bir uzak depo bulunamadı.");
    throw new Error('"origin" adında bir uzak depo bulunamadı.');
  }

  // Mevcut URL'den protokolü (https://) kaldırarak temiz bir URL elde et
  const repoUrl = origin.refs.fetch.replace(/^https?:\/\//, '');
  
  return `https://${username}:${token}@${repoUrl}`;
}

/**
 * Değişiklikleri mevcut aktif branch üzerinden kimliği doğrulanmış uzak depoya gönderir.
 * @throws {Error} Push işlemi sırasında bir hata oluşursa veya kimlik doğrulama başarısız olursa hata fırlatır.
 */
async function pushChanges(): Promise<void> {
  try {
    const authenticatedUrl = await getAuthenticatedRepoUrl();
    const currentBranch = await git.branch();
    await git.push(authenticatedUrl, currentBranch.current); 
    console.log(`pushChanges -> Başarılı: Değişiklikler GitHub'daki '${currentBranch.current}' dalına gönderildi.`);
  } catch (error: any) {
    console.error(`pushChanges -> Kritik Hata: GitHub'a gönderme işlemi sırasında bir hata oluştu. Hata: ${error.message}`);
    if (error.message.includes('authentication failed')) {
      throw new Error('GitHub kimlik doğrulaması başarısız oldu. Lütfen .env.local dosyasındaki GITHUB_USERNAME ve GITHUB_TOKEN değerlerini kontrol edin.');
    }
    throw new Error(`Değişiklikler başarıyla commit'lendi ancak GitHub'a gönderilemedi: ${error.message}`);
  }
}

/**
 * Git deposundaki son 50 commit'in geçmişini getirir.
 * @returns {Promise<any[]>} Commit log'larının bir dizisi. Hata durumunda boş bir dizi döner.
 */
export async function getCommitHistory(): Promise<any[]> {
  try {
    const log = await git.log({ '--max-count': 50 });
    return [...log.all];
  } catch (error: any) {
    console.error(`getCommitHistory -> Hata: Git geçmişi alınırken bir sorun oluştu. Hata: ${error.message}`);
    return [];
  }
}

/**
 * Git deposunun genel (public) URL'sini alır.
 * @returns {Promise<string | null>} Depo URL'si veya hata durumunda null.
 */
export async function getGitRepoUrl(): Promise<string | null> {
  try {
    const remotes = await git.getRemotes(true);
    const origin = remotes.find(remote => remote.name === 'origin');
    if (origin?.refs.fetch) {
      // SSH ve HTTPS formatlarını standart bir URL'ye dönüştür
      return origin.refs.fetch.replace(/^git@github.com:/, 'https://github.com/').replace(/\.git$/, '');
    }
    return null;
  } catch (error: any) {
    console.error(`getGitRepoUrl -> Hata: Git depo URL'si alınırken bir sorun oluştu. Hata: ${error.message}`);
    return null;
  }
}

/**
 * İçerik dosyalarındaki (markdown, json vb.) belirli değişiklikleri commit'ler ve uzak depoya gönderir.
 * @param {CommitDetails & { paths: string | string[] }} details - Commit detayları ve commit'lenecek dosya yolu/yolları.
 * @throws {Error} Commit veya push işlemi sırasında bir hata oluşursa hata fırlatır.
 */
export async function commitContentChange({ action, fileType, slug, user, paths }: CommitDetails & { paths: any }): Promise<void> {
  try {
    // Yolları doğrula: Bir string dizisi olduğundan emin ol ve string olmayan veya boş değerleri filtrele.
    const validPaths = (Array.isArray(paths) ? paths : [paths])
      .filter(p => typeof p === 'string' && p.trim() !== '');

    if (validPaths.length === 0) {
      console.warn("commitContentChange -> Uyarı: Commit atılacak geçerli bir dosya yolu bulunamadı. İşlem atlanıyor.", { action, fileType, slug });
      // Bu bir hata değil, sadece atlama durumu. Sadece veritabanı işlemlerinde bu beklenen bir durumdur.
      return;
    }

    const status = await git.status();
    
    const actionMap = { create: 'oluşturuldu', update: 'güncellendi', delete: 'silindi' };
    const commitMessage = `içerik: '${slug}' adlı ${fileType} ${user} tarafından ${actionMap[action]}. [ci skip]`;
    
    await git.add(validPaths);

    const stagedStatus = await git.status();
    if (stagedStatus.staged.length === 0) {
      console.log("commitContentChange -> Bilgi: Belirtilen dosyalarda commit atılacak bir değişiklik bulunamadı.");
      return;
    }
    
    await git.commit(commitMessage);
    await pushChanges();
  } catch (error: any) {
    console.error(`commitContentChange -> Hata: İçerik değişikliği işlenemedi. Hata: ${error.message}`);
    throw new Error(`İçerik değişikliği işlenemedi: ${error.message}`);
  }
}

/**
 * Belirtilen hash'e sahip bir commit'i geri alır ve değişikliği uzak depoya gönderir.
 * @param {string} hash - Geri alınacak commit'in hash'i.
 * @param {string} user - İşlemi yapan kullanıcı.
 * @throws {Error} Geri alma işlemi başarısız olursa hata fırlatır.
 */
export async function revertCommit(hash: string, user: string): Promise<void> {
  try {
    await git.revert(hash, ['--no-edit']);
    await pushChanges();
  } catch (error: any) {
    console.error(`revertCommit -> Hata: Commit geri alınamadı. Hash: ${hash}. Hata: ${error.message}`);
    // Geri alma işlemi başarısız olursa, depoyu temiz bir duruma getirmek için işlemi iptal et
    await git.raw('revert', '--abort').catch(abortError => console.error("revertCommit -> Kritik Hata: Geri alma işlemi iptal edilirken ek bir hata oluştu:", abortError));
    throw new Error(`'${hash}' hash'li commit geri alınamadı: ${error.message}`);
  }
}

/**
 /**
 * Projedeki tüm değişiklikleri (içerik hariç) belirli bir mesajla commit'ler ve uzak depoya gönderir.
 * @param {string} message - Commit mesajı.
 * @param {string} user - İşlemi yapan kullanıcı.
 * @returns {Promise<{success: boolean; message: string}>} İşlemin başarı durumunu ve mesajını içeren nesne.
 * @throws {Error} Değişiklik bulunamazsa veya işlem başarısız olursa hata fırlatır.
 */
export async function commitAllChanges(message: string, user: string): Promise<{success: boolean; message: string}> {
  try {
    const status = await git.status();
    if (status.files.length === 0) {
      console.log("commitAllChanges -> Bilgi: Commit atılacak bir değişiklik bulunamadı, işlem atlanıyor.");
      return { success: true, message: "Commit atılacak yeni bir değişiklik bulunmadığı için işlem atlandı." };
    }
    
    // The message is already formatted by the client according to Conventional Commits.
    // We just add the user info.
    const commitMessage = `${message} (by ${user}) `;
    
    await git.add('.');
    await git.commit(commitMessage);
    await pushChanges();
    
    return { success: true, message: "Tüm değişiklikler başarıyla commit'lendi ve GitHub'a gönderildi." };
  } catch (error: any) {
    console.error(`commitAllChanges -> Hata: Kaynak kodları işlenemedi. Hata: ${error.message}`);
    throw new Error(`Kaynak kodları işlenemedi: ${error.message}`);
  }
}

/**
 * Analyzes staged changes and suggests a conventional commit message with more contextual awareness.
 * @returns {Promise<{type: string, scope: string, subject: string}>} A suggested commit message structure.
 */
export async function analyzeChanges(): Promise<{type: string, scope: string, subject: string}> {
  const status = await git.status();
  const { files, created, deleted, modified } = status;

  if (files.length === 0) {
    return { type: 'chore', scope: 'git', subject: 'no changes detected to commit' };
  }

  // Prioritized type detection
  let type = 'chore'; // Default type
  const scopes = new Set<string>();
  
  // Rule-based type and scope detection
  const typePriority = ['build', 'ci', 'perf', 'fix', 'feat', 'refactor', 'style', 'docs', 'test'];
  let detectedType = 'chore';

  for (const file of files) {
    let currentFileType = 'chore';
    
    if (file.path.endsWith('package.json') || file.path.endsWith('package-lock.json')) currentFileType = 'build';
    else if (file.path.startsWith('.github') || file.path.startsWith('.docker')) currentFileType = 'ci';
    else if (file.path.includes('__tests__')) currentFileType = 'test';
    else if (file.path.startsWith('src/app/api')) currentFileType = 'feat';
    else if (file.path.startsWith('src/components')) currentFileType = 'feat';
    else if (file.path.startsWith('src/app') && file.path.includes('page.tsx')) currentFileType = 'feat';
    else if (file.path.startsWith('src/lib')) currentFileType = 'refactor';
    else if (file.path.startsWith('prisma/')) currentFileType = 'fix';
    else if (file.path.endsWith('.css') || file.path.includes('tailwind.config')) currentFileType = 'style';
    else if (file.path.endsWith('.md')) currentFileType = 'docs';

    if (typePriority.indexOf(currentFileType) > typePriority.indexOf(detectedType)) {
      detectedType = currentFileType;
    }

    // Add scope
    const parts = file.path.split('/');
    if (parts.length > 1) {
      if (parts[0] === 'src' && parts[1] === 'components') scopes.add(parts[2] || 'ui');
      else if (parts[0] === 'src' && parts[1] === 'app' && parts[2] === 'api') scopes.add('api');
      else if (parts[0] === 'src') scopes.add(parts[1]);
      else scopes.add(parts[0]);
    }
  }
  type = detectedType;

  // Create a meaningful subject
  let subject = '';
  if (files.length === 1) {
    const file = files[0];
    const action = created.includes(file.path) ? 'add' : deleted.includes(file.path) ? 'remove' : 'update';
    subject = `${action} ${path.basename(file.path)}`;
  } else if (created.length > 0 && modified.length === 0 && deleted.length === 0) {
    subject = `add ${created.length} new file(s)`;
  } else if (deleted.length > 0 && modified.length === 0 && created.length === 0) {
    subject = `remove ${deleted.length} file(s)`;
  } else {
    subject = `update ${files.length} files across ${scopes.size} scope(s)`;
  }

  // Special case for dependency updates
  if (files.every(f => ['package.json', 'package-lock.json'].includes(f.path))) {
    type = 'build';
    scopes.clear();
    scopes.add('deps');
    subject = 'update dependencies';
  }

  return {
    type,
    scope: Array.from(scopes).join(', '),
    subject: subject.toLowerCase(),
  };
}

/**
 * GitHub bağlantısını ve kimlik bilgilerinin doğruluğunu test eder.
 * @returns {Promise<{ok: boolean; message: string}>} Test sonucunu içeren nesne.
 */
export async function testGitConnection(): Promise<{ok: boolean; message: string}> {
    try {
        // Kimlik bilgilerinin varlığını ve uzak depo URL'sinin alınabildiğini kontrol et
        await getAuthenticatedRepoUrl();
        // Uzak depodaki branch'leri listeleyerek basit bir bağlantı testi yap
        await git.listRemote(['--heads']);
        return { ok: true, message: 'GitHub bağlantısı ve kimlik bilgileri başarıyla doğrulandı.' };
    } catch (error: any) {
        console.error(`testGitConnection -> Hata: GitHub bağlantı testi başarısız oldu. Hata: ${error.message}`);
        // Hata mesajını olduğu gibi döndürerek kullanıcıya daha fazla bilgi ver
        return { ok: false, message: error.message };
    }
}
