<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { getBatchValues, getValues, isLatest } from '$lib/model/sheet';
	import { Clock, ArrowLeft, ArrowRight, Activity } from 'lucide-svelte/icons';

	// Store
	let activities = writable<Array<Activity>>([]);
	let activeMonth = writable(new Date().getMonth() + 1);
	let activeDate = writable<number>(-1);
	let dateEvents = writable<DateEvent[]>([]);
	let dateLength = writable(new Date(2025, $activeMonth, 0).getDate());

	function getWeek() {
		let initialMonth = 8;
		let initialFirstWeek = 10;
		let diffMonth = $activeMonth - initialMonth;
		let dateLengthOfLastMonth = new Date(2025, $activeMonth - 1, 0).getDate();
		let diff = diffMonth * dateLengthOfLastMonth + $activeDate - initialFirstWeek;
		let res = diff / 7;

		let week = diff % 7 == 0 ? res + 1 : Math.ceil(res);

		return week;
	}
	type DateEvent = {
		day: number;
		month: number;
	};

	type Activity = {
		content: string;
		startTime: string;
		endTime: string;
		notes: string;
		status: string;
		day?: number;
		month?: number;
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

	let days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

	async function getAllEvents(week?: number) {
		if (await isLatest())
			try {
				let events = JSON.parse(localStorage.getItem('events') ?? '');
				let dates = JSON.parse(localStorage.getItem('dateEvents') ?? '') as DateEvent[];
				if (dates) dateEvents.set(dates);
				if (events)
					return events.find(
						(d: { week: number; activities: Activity[] }) => d.week == (week ?? 0)
					);
			} catch (e) {
				console.error(e);
			}

		let weeks = 8;
		let eventOnWeeks: { week: number; activities: Activity[] }[] = [];
		let sheetsNames: string[] = [];
		for (let i = 1; i <= weeks; i++) sheetsNames.push(`Minggu ${i}!A6:F`);

		let bulkValues = await getBatchValues(sheetsNames);
		let dates: DateEvent[] = [];

		for (let bv of bulkValues) {
			let activities = extractEvent(bv.values);
			let week = bv.range.split('Minggu ')[1].split("'!")[0];
			eventOnWeeks.push({ week, activities });
			dates.push(
				...activities
					.filter((d) => d.day && d.month)
					.map((d) => {
						return { day: d.day ?? 0, month: d.month ?? 0 };
					})
			);
		}

		dateEvents.set(dates);
		localStorage.setItem('dateEvents', JSON.stringify(dates));
		localStorage.setItem('events', JSON.stringify(eventOnWeeks));
		if (week) return eventOnWeeks.find((d) => d.week == week);
	}

	function extractEvent(values: []): Activity[] {
		let startTime = '';
		let endTime = '';
		let activities: Activity[] = [];
		let lastDate = '';

		for (let value of values) {
			let date = value[0] as string;
			if (value[1] != '') startTime = value[1];
			if (value[2] != '') endTime = value[2];
			let content = value[3];
			let notes = value[4];
			let status = value[5];

			if (content == '') continue;
			if (date == '') date = lastDate;

			lastDate = date;
			let dateObj = new Date(date);
			let activity: Activity = {
				startTime,
				endTime,
				content,
				notes,
				status,
				month: dateObj.getMonth() + 1,
				day: dateObj.getDate()
			};
			activities.push(activity);
		}

		return activities;
	}

	function changeMonth(type: 'next' | 'prev') {
		if ($activeMonth == 12 && type == 'next') return;
		if ($activeMonth == 1 && type == 'prev') return;

		if (type == 'next') activeMonth.set($activeMonth + 1);
		else activeMonth.set($activeMonth - 1);

		dateLength.set(new Date(2025, $activeMonth, 0).getDate());
	}

	async function selectDate(date: number) {
		activeDate.set(date);
		let week = getWeek();
		let events = (await getAllEvents(week))?.activities ?? [];
		console.log(events);
		activities.set(events.filter((e: Activity) => e.day == $activeDate && e.month == $activeMonth));
	}

	onMount(async () => {
		await getAllEvents();
	});
</script>

<div
	class="
	mx-4 mt-8 mb-32 block min-h-[100vh] items-start justify-start
	sm:mx-auto
	sm:flex sm:flex-col sm:items-center xl:mt-0 xl:flex xl:flex-row xl:items-start xl:justify-center xl:gap-4 xl:px-14 xl:pt-24"
>
	<div class="sm:max-w-[480px] xl:mx-4 xl:min-h-[720px] xl:w-[800px]">
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
		<div class="relative mt-4 flex gap-2 overflow-x-scroll xl:grid xl:grid-cols-4">
			{#each { length: $dateLength }, date}
				<button
					onclick={() => selectDate(date + 1)}
					class="mx my-0 flex flex-col gap-2 rounded-xl border-2 border-gray-900 p-5 text-xl font-bold shadow-xl backdrop-blur-xl {date +
						1 ==
					$activeDate
						? 'bg-white text-gray-900'
						: 'bg-gray-900 text-white'} {new Date(2025, $activeMonth - 1, date + 1).getDay() == 0
						? 'bg-red-900 border-red-900'
						: ''}"
				>
					{#if $dateEvents.find((d) => d.day == date + 1 && d.month == $activeMonth) != undefined}
						<span class="absolute top-2 right-2 inline-flex size-4 rounded-full bg-sky-500"></span>
					{/if}
					<p class="p-2 pb-1">{date + 1 > 9 ? date + 1 : `0${date + 1}`}</p>
					<span class="text-normal font-normal"
						>{days[new Date(2025, $activeMonth - 1, date + 1).getDay()]}</span
					>
				</button>
			{/each}
		</div>
	</div>

	<div class="mt-4 max-h-[720px] text-xl sm:w-[480px] xl:mt-0">
		<div class="rounded-xl bg-gray-900 p-4 text-center text-xl font-bold text-white">
			<span>Kegiatan</span>
		</div>

		<div class="overflow-y-scroll rounded-xl p-8 shadow-xl xl:mt-4 xl:max-h-[720px]">
			{#if $activities.length == 0}
				<div class="p-4 text-center">No Activity</div>
			{/if}
			{#each $activities as activity}
				<div class="mt-2 mb-4">
					<div class="rounded-xl bg-gray-900 p-4 text-white">
						<div>{activity.content}</div>
						<div class="mt-4 flex items-center justify-between gap-2 rounded-md bg-white">
							<div class="flex items-center gap-1 rounded-xl p-2 font-bold text-gray-900">
								<Clock />

								{activity.startTime}
							</div>
							<div class="flex items-center gap-1 rounded-xl bg-white p-2 font-bold text-gray-900">
								<Clock />
								{activity.endTime}
							</div>
						</div>
					</div>

					<div class="bg-whtie mx-auto w-[95%] rounded-b-xl border-1 border-gray-500 p-4 shadow-xl">
						{#each activity.notes.split('\n') as n}
							<p class="mt-2 text-gray-700">{n}</p>
						{/each}
						{#if activity.status != ''}
							<p
								class="mt-4 rounded-xl p-2 text-center text-white"
								style="
							background-color: {activity.status === 'Ditunda'
									? '#facc15' /* yellow-400 */
									: activity.status === 'Berjalan'
										? '#3b82f6' /* blue-500 */
										: activity.status === 'Selesai'
											? '#22c55e' /* green-500 */
											: activity.status === 'Dibatalkan'
												? '#ef4444' /* red-500 */
												: activity.status === 'Dilanjutkan'
													? '#a21caf' /* purple-700 */
													: '#111827'};
							color: white;"
							>
								{activity.status}
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
