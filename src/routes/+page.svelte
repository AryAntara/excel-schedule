<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { getValues } from '$lib/model/sheet';
	import { ArrowLeft, ArrowRight } from 'lucide-svelte/icons';

	let activities = writable<Array<Activity>>([
		{
			content: 'Test Content',
			startTime: '00.00',
			endTime: '00.00',
			notes: 'Test Content',
			status: 'Test Content'
		}
	]);
	let activeMonth = writable(8);
	let activeDate = writable<number>(-1);

	let dateLength = writable(new Date(2025, $activeMonth, 0).getDate());

	function getWeek() {
		let initialMonth = 8;
		let initialFirstWeek = 10;
		let diffMonth = $activeMonth - initialMonth;
		let diff = diffMonth * $dateLength + $activeDate - initialFirstWeek;
		let res = diff / 7;

		let week = diff % 7 == 0 ? res + 1 : Math.ceil(res);

		return week;
	}

	type Activity = {
		content: string;
		startTime: string;
		endTime: string;
		notes: string;
		status: string;
	};

	let months = [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember'
	];

	function changeMonth(type: 'next' | 'prev') {
		if ($activeMonth == 12 && type == 'next') return;
		if ($activeMonth == 1 && type == 'prev') return;

		if (type == 'next') activeMonth.set($activeMonth + 1);
		else activeMonth.set($activeMonth - 1);

		dateLength.set(new Date(2025, $activeMonth, 0).getDate());
	}

	async function selectDate(date: number) {
		activeDate.set(date);

		let formattedDate = `${$activeMonth}/${$activeDate}/2025`;
		let week = getWeek();

		// Get By week
		let sheetName = `Minggu ${week}`;
		let values = await getValues(`${sheetName}!A1:F`);

		activities.set([]);

		let got = false;
		let startTime = '';
		let endTime = '';
		for (let value of values) {
			let date = value[0];
			if (value[1] != '') startTime = value[1];
			if (value[2] != '') endTime = value[2];
			let content = value[3];
			let notes = value[4];
			let status = value[5];

			if (content == '') continue;
			if (date != '') got = false;
			if (date == formattedDate || (got && date == '')) {
				got = true;
				let activity: Activity = { startTime, endTime, content, notes, status };
				let activitiesD = $activities;
				activitiesD.push(activity);
				activities.set(activitiesD);
			}
		}

		console.log(values);
	}

	onMount(async () => {
		getWeek();
	});
</script>

<div class="m-4 max-h-[2800px] max-w-[480px] md:mx-auto">
	<div
		class="flex items-center justify-between rounded-xl bg-gray-900 p-4 text-center text-xl font-bold text-white"
	>
		<button onclick={() => changeMonth('prev')} class="rounded-full bg-white p-2 text-gray-900">
			<ArrowLeft />
		</button>
		<span>{months[$activeMonth - 1]}</span>
		<button class="rounded-full bg-white p-2 text-gray-900" onclick={() => changeMonth('next')}>
			<ArrowRight />
		</button>
	</div>
	<div class="mt-4 flex gap-4 overflow-x-scroll">
		{#each { length: $dateLength }, date}
			<button
				onclick={() => selectDate(date + 1)}
				class="flex gap-5 rounded-xl border-2 border-gray-900 p-5 text-xl font-bold shadow-lg backdrop-blur-xl {date +
					1 ==
				$activeDate
					? 'bg-white text-gray-900'
					: 'bg-gray-900 text-white'}"
			>
				<p class="p-2">{date + 1 > 9 ? date + 1 : `0${date + 1}`}</p>
			</button>
		{/each}
	</div>
	<div class="mt-4 text-xl">
		{#if $activities.length == 0}
			<div class="p-4 text-center">No Activity</div>
		{/if}
		{#each $activities as activity}
			<div class="my-4">
				<div class="rounded-xl bg-gray-900 p-4 text-white">
					<div>{activity.content}</div>
					<div class="mt-4 flex items-center justify-between gap-2 rounded-md bg-white">
						<div class="rounded-xl p-2 font-bold text-gray-900">{activity.startTime}</div>
						<div class="rounded-xl bg-white p-2 font-bold text-gray-900">{activity.endTime}</div>
					</div>
				</div>

				<div class="bg-whtie mx-auto w-[95%] rounded-b-xl border-1 border-gray-500 p-4 shadow-lg">
					{#each activity.notes.split('\n') as n}
						<p class="mt-2 text-gray-700">{n}</p>
					{/each}
					{#if activity.status != ''}
						<p class="mt-4 rounded-xl bg-gray-900 p-2 text-center text-white">{activity.status}</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>
