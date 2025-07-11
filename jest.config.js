// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

// next/jest'in varsayılan yapılandırmasını alıp üzerine bizim ayarımızı ekliyoruz.
const asyncConfig = createJestConfig(customJestConfig)

module.exports = async () => {
  const config = await asyncConfig()
  config.transformIgnorePatterns = [
    // node_modules'daki tüm paketleri dönüştürme, 
    // AMA parantez içindekiler HARİÇ.
    '/node_modules/(?!unified|remark|rehype|unist-.*|hast-.*|bail|trough|vfile|web-namespaces|property-information|space-separated-tokens|comma-separated-tokens|micromark.*|mdast-util.*|character-entities)/',
    '^.+\.module\.(css|sass|scss)$',
  ]
  return config
}