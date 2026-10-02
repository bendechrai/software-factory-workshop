// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://bendechrai.github.io',
	base: '/software-factory-workshop',
	integrations: [
		starlight({
			title: 'Build your own software factory',
			description:
				'A two-day, hands-on workshop that takes you from vibe coding to an autonomous orchestrator around your coding harness.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/bendechrai/software-factory-workshop',
				},
			],
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'Welcome', link: '/' },
						{ label: 'What a software factory is', slug: 'start/what-a-factory-is' },
						{ label: 'The two days at a glance', slug: 'start/agenda' },
						{ label: 'Before you arrive', slug: 'start/before-you-arrive' },
					],
				},
				{
					label: 'Day 1: from prompt to pipeline',
					items: [{ autogenerate: { directory: 'day-1' } }],
				},
				{
					label: 'Day 2: from pipeline to factory',
					items: [{ autogenerate: { directory: 'day-2' } }],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
