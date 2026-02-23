# Estrutura de Arquivos Públicos

Esta pasta contém arquivos estáticos que são servidos diretamente pelo Next.js.

## Estrutura

### `/images`
Imagens gerais do aplicativo:
- `logo.svg` ou `logo.png` - Logo principal do Easyfy
- `logo-dark.svg` ou `logo-dark.png` - Logo para tema escuro (opcional)
- `og-image.png` - Imagem para Open Graph (redes sociais)

### `/icons`
Ícones e favicons:
- `favicon.ico` - Favicon principal (16x16, 32x32)
- `icon.svg` - Ícone SVG adaptável
- `apple-touch-icon.png` - Ícone para dispositivos Apple (180x180)
- `icon-192.png` - PWA icon (192x192)
- `icon-512.png` - PWA icon (512x512)

## Uso

Para usar essas imagens no código, importe do Next.js:

```tsx
import Image from 'next/image';

// Uso:
<Image src="/images/logo.svg" alt="Easyfy" width={120} height={40} />
```

Ou como link direto:
```tsx
<img src="/images/logo.svg" alt="Easyfy" />
```
