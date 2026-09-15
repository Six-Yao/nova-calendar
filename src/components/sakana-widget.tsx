'use client';

import { useEffect, useRef, useState } from 'react';

const CHARACTER_IMAGES = [
  'AliusSDcute.webp',
  'ArurauneSDcute.webp',
  'AshuriSDcute.webp',
  'ChocolateSDcute.webp',
  'CiciniSDcute.webp',
  'CocoaSDcute.webp',
  'EriNoahSDcute.webp',
  'IrisuSDcute.webp',
  'KekeBunnySDcute.webp',
  'KotriSDcuteblue.webp',
  'KotriSDcutegreen.webp',
  'KotriSDcutered.webp',
  'LilithSDcute.webp',
  'Lilli.webp',
  'MiriamSDcute.webp',
  'MiruSDcute.webp',
  'NieveSDcute.webp',
  'NixieSDcute.webp',
  'NoahSDcute.webp',
  'PandoraSDcute.webp',
  'Pixie.webp',
  'RibbonSDcute.webp',
  'RitaSDcute.webp',
  'RumiSDcute.webp',
  'SayaSDcute.webp',
  'SeanaSDcute.webp',
  'SyaroSDcute.webp',
  'VanillaSDcute.webp'
];

export default function SakanaWidgetBox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    type SakanaWidgetInstance = {
      mount: (el: HTMLElement | string) => void;
      unmount: () => void;
    };

    let widget: SakanaWidgetInstance | null = null;

    import('sakana-widget').then(({ default: SakanaWidget }) => {
      CHARACTER_IMAGES.forEach((file, index) => {
        const name = file.replace(/\.webp$/i, '');
        const character = SakanaWidget.getCharacter('chisato')!;
        character.image = `/assets/${file}`;
        SakanaWidget.registerCharacter(name, character);
      });


      const randomIndex = Math.floor(Math.random() * CHARACTER_IMAGES.length);
      const defaultName = CHARACTER_IMAGES[randomIndex].replace(/\.webp$/i, '');

      widget = new SakanaWidget({ character: defaultName });
      widget.mount(containerRef.current!);
    });

    return () => {
      widget?.unmount();
    };
  }, [mounted]);

  if (!mounted) return <div style={{ width: 200, height: 200 }} />;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        right: 80,
        bottom: 100,
        zIndex: 9999,
        width: 100,
        height: 100,
      }}
    />
  );
}