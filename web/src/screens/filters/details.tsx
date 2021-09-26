import { Fragment, useRef } from "react";
import { Dialog, Transition, Switch as SwitchBasic } from "@headlessui/react";
import { ChevronDownIcon, ChevronRightIcon, ExclamationIcon, } from '@heroicons/react/solid'
import { EmptyListState } from "../../components/EmptyListState";

import {
    NavLink,
    Route,
    Switch as RouteSwitch,
    useHistory,
    useLocation,
    useParams,
    useRouteMatch
} from "react-router-dom";
import { Action, ActionType, DownloadClient, Filter, Indexer } from "../../domain/interfaces";
import { useToggle } from "../../hooks/hooks";
import { useMutation, useQuery } from "react-query";
import { queryClient } from "../../App";
import { CONTAINER_OPTIONS, CODECS_OPTIONS, RESOLUTION_OPTIONS, SOURCES_OPTIONS, ActionTypeNameMap, ActionTypeOptions } from "../../domain/constants";
import { TextField, SwitchGroup, Select, MultiSelect, NumberField, DownloadClientSelect } from "./inputs";

import DEBUG from "../../components/debug";
import TitleSubtitle from "../../components/headings/TitleSubtitle";
import { classNames } from "../../styles/utils";
import SelectM from "react-select";
import APIClient from "../../api/APIClient";
import { buildPath } from "../../utils/utils"

import { toast } from 'react-hot-toast'
import Toast from '../../components/notifications/Toast';

import { Field, FieldArray, Form, Formik } from "formik";
import { AlertWarning } from "../../components/alerts";
import { DeleteModal } from "../../components/modals";

const tabs = [
    { name: 'General', href: '', current: true },
    { name: 'Movies and TV', href: 'movies-tv', current: false },
    // { name: 'P2P', href: 'p2p', current: false },
    { name: 'Advanced', href: 'advanced', current: false },
    { name: 'Actions', href: 'actions', current: false },
]

function TabNavLink({ item, url }: any) {
    const location = useLocation();

    const { pathname } = location;
    const splitLocation = pathname.split("/");

    // we need to clean the / if it's a base root path
    let too = item.href ? `${url}/${item.href}` : url

    return (
        <NavLink
            key={item.name}
            to={too}
            exact={true}
            activeClassName="border-purple-600 dark:border-blue-500 text-purple-600 dark:text-white"
            className={classNames(
                'border-transparent text-gray-500 hover:text-purple-600 dark:hover:text-white hover:border-purple-600 dark:hover:border-blue-500 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            )}
            aria-current={splitLocation[2] === item.href ? 'page' : undefined}
        >
            {item.name}
        </NavLink>
    )
}

const FormButtonsGroup = ({ deleteAction, reset, dirty }: any) => {
    const [deleteModalIsOpen, toggleDeleteModal] = useToggle(false)

    const cancelButtonRef = useRef(null)

    return (
        <div className="pt-6 divide-y divide-gray-200 dark:divide-gray-700">

            <Transition.Root show={deleteModalIsOpen} as={Fragment}>
                <Dialog
                    as="div"
                    static
                    className="fixed z-10 inset-0 overflow-y-auto"
                    initialFocus={cancelButtonRef}
                    open={deleteModalIsOpen}
                    onClose={toggleDeleteModal}
                >
                    <div
                        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                        </Transition.Child>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                            &#8203;
                        </span>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <div
                                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div
                                            className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <ExclamationIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <Dialog.Title as="h3"
                                                className="text-lg leading-6 font-medium text-gray-900">
                                                Remove filter
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Are you sure you want to remove this filter?
                                                    This action cannot be undone.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={deleteAction}
                                    >
                                        Remove
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 light:bg-white text-base font-medium text-gray-700 dark:text-red-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={toggleDeleteModal}
                                        ref={cancelButtonRef}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            <div className="mt-4 pt-4 flex justify-between">
                <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 dark:text-red-500 light:bg-red-100 light:hover:bg-red-200 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                    onClick={toggleDeleteModal}
                >
                    Remove
                </button>

                <div>
                    {/* {dirty && <span className="mr-4 text-sm text-gray-500">Unsaved changes..</span>} */}
                    <button
                        type="button"
                        className="light:bg-white light:border light:border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 dark:text-gray-500 light:hover:bg-gray-50 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={reset}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="ml-4 relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 dark:bg-blue-600 hover:bg-indigo-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function FilterDetails() {
    let { url } = useRouteMatch();
    let history = useHistory();
    let { filterId }: any = useParams();

    const { isLoading, data } = useQuery<Filter, Error>(['filter', parseInt(filterId)], () => APIClient.filters.getByID(parseInt(filterId)),
        {
            retry: false,
            refetchOnWindowFocus: false,
            onError: err => {
                history.push("./")
            }
        },
    )

    const { data: indexers } = useQuery<Indexer[], Error>('indexerList', APIClient.indexers.getOptions,
        {
            refetchOnWindowFocus: false
        }
    )

    const updateMutation = useMutation((filter: Filter) => APIClient.filters.update(filter), {
        onSuccess: (filter) => {
            // queryClient.setQueryData(['filter', filter.id], data)
            toast.custom((t) => <Toast type="success" body={`${filter.name} was updated successfully`} t={t} />)

            queryClient.invalidateQueries(["filter", filter.id]);
        }
    })

    const deleteMutation = useMutation((id: number) => APIClient.filters.delete(id), {
        onSuccess: (filter) => {
            // invalidate filters
            queryClient.invalidateQueries("filter");
            toast.custom((t) => <Toast type="success" body={`${filter.name} was deleted`} t={t} />)

            // redirect
            history.push("/filters")
        }
    })

    if (isLoading) {
        return null
    }

    if (!data) {
        return null
    }

    const handleSubmit = (data: any) => {
        console.log("submit other");

        updateMutation.mutate(data)
    }

    const deleteAction = () => {
        deleteMutation.mutate(data.id)
    }

    const handleMobileNav = (e: any, href: string) => {
        let s = history.location.pathname.split(/((?:\/.*?)?\/filters\/\d)/gi)

        let p = buildPath(s[1], href)

        history.push(p)
    }

    return (
        <main className="-mt-48 ">
            <header className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                    <h1 className="text-3xl font-bold text-white capitalize">
                        <NavLink to="/filters" exact={true}>
                            Filters
                        </NavLink>
                    </h1>
                    <ChevronRightIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                    <h1 className="text-3xl font-bold text-white capitalize">{data.name}</h1>
                </div>
            </header>
            <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="relative mx-auto md:px-6 xl:px-4">
                        <div className="px-4 sm:px-6 md:px-0">
                            <div className="pt-2 pb-6">

                                <div className="sm:hidden">
                                    <label htmlFor="selected-tab" className="sr-only">
                                        Select a tab
                                    </label>
                                    <select
                                        id="selected-tab"
                                        name="selected-tab"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                                    >
                                        {tabs.map((tab) => (
                                            <option key={tab.name} onClick={(e) => handleMobileNav(e, tab.href)}>
                                                {tab.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="border-b border-gray-200 dark:border-gray-700">
                                        <nav className="-mb-px flex space-x-8">
                                            {tabs.map((tab) => (
                                                <TabNavLink item={tab} url={url} key={tab.href} />
                                            ))}
                                        </nav>
                                    </div>
                                </div>

                                <Formik
                                    initialValues={{
                                        id: data.id,
                                        name: data.name,
                                        enabled: data.enabled || false,
                                        min_size: data.min_size,
                                        max_size: data.max_size,
                                        delay: data.delay,
                                        shows: data.shows,
                                        years: data.years,
                                        resolutions: data.resolutions || [],
                                        sources: data.sources || [],
                                        codecs: data.codecs || [],
                                        containers: data.containers || [],
                                        seasons: data.seasons,
                                        episodes: data.episodes,
                                        match_releases: data.match_releases,
                                        except_releases: data.except_releases,
                                        match_release_groups: data.match_release_groups,
                                        except_release_groups: data.except_release_groups,
                                        match_categories: data.match_categories,
                                        except_categories: data.except_categories,
                                        match_tags: data.match_tags,
                                        except_tags: data.except_tags,
                                        match_uploaders: data.match_uploaders,
                                        except_uploaders: data.except_uploaders,
                                        freeleech: data.freeleech,
                                        freeleech_percent: data.freeleech_percent,
                                        indexers: data.indexers || [],
                                        actions: data.actions || [],
                                    }}
                                    onSubmit={handleSubmit}
                                >
                                    {({ isSubmitting, values, dirty, resetForm }) => (
                                        <Form>
                                            <RouteSwitch>
                                                <Route exact path={url}>
                                                    <General indexers={indexers as any} />
                                                </Route>

                                                <Route path={`${url}/movies-tv`}>
                                                    <MoviesTv />
                                                </Route>

                                                <Route path={`${url}/advanced`}>
                                                    <Advanced />
                                                </Route>

                                                <Route path={`${url}/actions`}>
                                                    <FilterActions filter={data} values={values} />
                                                </Route>
                                            </RouteSwitch>

                                            <FormButtonsGroup deleteAction={deleteAction} dirty={dirty} reset={resetForm} />

                                            <DEBUG values={values} />
                                        </Form>
                                    )}
                                </Formik>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

interface GeneralProps {
    indexers: Indexer[];
}

function General({ indexers }: GeneralProps) {

    let opts = indexers ? indexers.map(v => ({
        label: v.name,
        value: v
    })) : [];

    return (
        <div>
            <div className="mt-6 lg:pb-8">

                <div className="mt-6 grid grid-cols-12 gap-6">
                    <TextField name="name" label="Filter name" columns={6} placeholder="eg. Filter 1" />

                    <div className="col-span-6">
                        <label htmlFor="indexers" className="block text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                            Indexers
                        </label>

                        <Field name="indexers" type="select" multiple={true}>
                            {({
                                field,
                                form: { setFieldValue },
                            }: any) => {
                                return (
                                    <SelectM
                                        {...field}
                                        value={field.value && field.value.map((v: any) => ({
                                            label: v.name,
                                            value: v
                                        }))}
                                        onChange={(values: any) => {
                                            let am = values && values.map((i: any) => i.value)

                                            setFieldValue(field.name, am)
                                        }}
                                        isClearable={true}
                                        isMulti={true}
                                        placeholder="Choose indexers"
                                        className="mt-2 block w-full focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        options={opts}
                                    />
                                )
                            }}
                        </Field>
                    </div>
                </div>
            </div>

            <div className="mt-6 lg:pb-8">
                <TitleSubtitle title="Rules" subtitle="Set rules" />

                <div className="mt-6 grid grid-cols-12 gap-6">
                    <TextField name="min_size" label="Min size" columns={6} placeholder="" />
                    <TextField name="max_size" label="Max size" columns={6} placeholder="" />
                    <TextField name="delay" label="Delay" columns={6} placeholder="" />
                </div>
            </div>

            <div className="border-t dark:border-gray-700">
                <SwitchGroup name="enabled" label="Enabled" description="Enabled or disable filter." />
            </div>

        </div>
    );
}

// interface FilterTabGeneralProps {
//     filter: Filter;
// }

function MoviesTv() {

    return (
        <div>
            <div className="mt-6 grid grid-cols-12 gap-6">
                <TextField name="shows" label="Movies / Shows" columns={8} placeholder="eg. Movie,Show 1,Show?2" />
                <TextField name="years" label="Years" columns={4} placeholder="eg. 2018,2019-2021" />
            </div>

            <div className="mt-6 lg:pb-8">
                <TitleSubtitle title="Seasons and Episodes" subtitle="Set seaons and episodes" />

                <div className="mt-6 grid grid-cols-12 gap-6">
                    <TextField name="seasons" label="Seasons" columns={8} placeholder="eg. 1,3,2-6" />
                    <TextField name="episodes" label="Episodes" columns={4} placeholder="eg. 2,4,10-20" />
                </div>
            </div>

            <div className="mt-6 lg:pb-8">
                <TitleSubtitle title="Quality" subtitle="Resolution, source etc." />

                <div className="mt-6 grid grid-cols-12 gap-6">
                    <MultiSelect name="resolutions" options={RESOLUTION_OPTIONS} label="resolutions" columns={6} />
                    <MultiSelect name="sources" options={SOURCES_OPTIONS} label="sources" columns={6} />
                </div>

                <div className="mt-6 grid grid-cols-12 gap-6">
                    <MultiSelect name="codecs" options={CODECS_OPTIONS} label="codecs" columns={6} />
                    <MultiSelect name="containers" options={CONTAINER_OPTIONS} label="containers" columns={6} />
                </div>
            </div>
        </div>
    )
}

function Advanced() {
    const [releasesIsOpen, toggleReleases] = useToggle(false)
    const [groupsIsOpen, toggleGroups] = useToggle(false)
    const [categoriesIsOpen, toggleCategories] = useToggle(false)
    const [uploadersIsOpen, toggleUploaders] = useToggle(false)
    const [freeleechIsOpen, toggleFreeleech] = useToggle(false)

    return (
        <div>
            <div className="mt-6 lg:pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleReleases}>
                    <div className="-ml-2 -mt-2 flex flex-wrap items-baseline">
                        <h3 className="ml-2 mt-2 text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">Releases</h3>
                        <p className="ml-2 mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">Match or ignore</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border-transparent text-sm font-medium text-white"
                        >
                            {releasesIsOpen ? <ChevronDownIcon className="h-6 w-6 text-gray-500" aria-hidden="true" /> : <ChevronRightIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                {releasesIsOpen && (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <TextField name="match_releases" label="Match releases" columns={6} placeholder="eg. *some?movie*,*some?show*s01*" />
                        <TextField name="except_releases" label="Except releases" columns={6} placeholder="" />
                    </div>
                )}
            </div>

            <div className="mt-6 lg:pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleGroups}>
                    <div className="-ml-2 -mt-2 flex flex-wrap items-baseline">
                        <h3 className="ml-2 mt-2 text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">Groups</h3>
                        <p className="ml-2 mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">Match or ignore</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border-transparent text-sm font-medium text-white"
                        >
                            {groupsIsOpen ? <ChevronDownIcon className="h-6 w-6 text-gray-500" aria-hidden="true" /> : <ChevronRightIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                {groupsIsOpen && (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <TextField name="match_release_groups" label="Match release groups" columns={6} placeholder="eg. group1,group2" />
                        <TextField name="except_release_groups" label="Except release groups" columns={6} placeholder="eg. badgroup1,badgroup2" />
                    </div>
                )}
            </div>

            <div className="mt-6 lg:pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleCategories}>
                    <div className="-ml-2 -mt-2 flex flex-wrap items-baseline">
                        <h3 className="ml-2 mt-2 text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">Categories and tags</h3>
                        <p className="ml-2 mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">Match or ignore categories or tags</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border-transparent text-sm font-medium text-white"
                        >
                            {categoriesIsOpen ? <ChevronDownIcon className="h-6 w-6 text-gray-500" aria-hidden="true" /> : <ChevronRightIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                {categoriesIsOpen && (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <TextField name="match_categories" label="Match categories" columns={6} placeholder="eg. *category*,category1" />
                        <TextField name="except_categories" label="Except categories" columns={6} placeholder="eg. *category*" />

                        <TextField name="match_tags" label="Match tags" columns={6} placeholder="eg. tag1,tag2" />
                        <TextField name="except_tags" label="Except tags" columns={6} placeholder="eg. tag1,tag2" />
                    </div>
                )}
            </div>

            <div className="mt-6 lg:pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleUploaders}>
                    <div className="-ml-2 -mt-2 flex flex-wrap items-baseline">
                        <h3 className="ml-2 mt-2 text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">Uploaders</h3>
                        <p className="ml-2 mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">Match or ignore uploaders</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border-transparent text-sm font-medium text-white"
                        >
                            {uploadersIsOpen ? <ChevronDownIcon className="h-6 w-6 text-gray-500" aria-hidden="true" /> : <ChevronRightIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                {uploadersIsOpen && (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <TextField name="match_uploaders" label="Match uploaders" columns={6} placeholder="eg. uploader1" />
                        <TextField name="except_uploaders" label="Except uploaders" columns={6} placeholder="eg. anonymous" />
                    </div>
                )}
            </div>

            <div className="mt-6 lg:pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center cursor-pointer" onClick={toggleFreeleech}>
                    <div className="-ml-2 -mt-2 flex flex-wrap items-baseline">
                        <h3 className="ml-2 mt-2 text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">Freeleech</h3>
                        <p className="ml-2 mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">Match only freeleech and freeleech percent</p>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-4">
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border-transparent text-sm font-medium text-white"
                        >
                            {freeleechIsOpen ? <ChevronDownIcon className="h-6 w-6 text-gray-500" aria-hidden="true" /> : <ChevronRightIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
                {freeleechIsOpen && (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <div className="col-span-6">
                            <SwitchGroup name="freeleech" label="Freeleech" />
                        </div>

                        <TextField name="freeleech_percent" label="Freeleech percent" columns={6} />
                    </div>
                )}
            </div>
        </div>
    )
}

interface FilterActionsProps {
    filter: Filter;
    values: any;
}

function FilterActions({ filter, values }: FilterActionsProps) {
    const { data } = useQuery<DownloadClient[], Error>('downloadClients', APIClient.download_clients.getAll,
        {
            refetchOnWindowFocus: false
        }
    )

    let newAction = {
        name: "new action",
        enabled: true,
        type: "TEST",
        watch_folder: "",
        exec_cmd: "",
        exec_args: "",
        category: "",
        tags: "",
        label: "",
        save_path: "",
        paused: false,
        ignore_rules: false,
        limit_upload_speed: 0,
        limit_download_speed: 0,
        filter_id: filter.id,
        //   client_id: 0,
    }

    return (
        <div className="mt-10">
            <FieldArray name="actions">
                {({ remove, push }) => (
                    <Fragment>
                        <div className="-ml-4 -mt-4 mb-6 flex justify-between items-center flex-wrap sm:flex-nowrap">
                            <div className="ml-4 mt-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-200">Actions</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Add to download clients or run custom commands.
                                </p>
                            </div>
                            <div className="ml-4 mt-4 flex-shrink-0">
                                <button
                                    type="button"
                                    className="relative inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 dark:bg-blue-600 hover:bg-indigo-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-blue-500"
                                    onClick={() => push(newAction)}
                                >
                                    Add new
                                </button>
                            </div>
                        </div>

                        <div className="light:bg-white dark:bg-gray-800 light:shadow sm:rounded-md">
                            {values.actions.length > 0 ?
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {values.actions.map((action: any, index: any) => (
                                        <FilterActionsItem action={action} clients={data!} idx={index} remove={remove} />
                                    ))}
                                </ul>
                                : <EmptyListState text="No actions yet!" />
                            }
                        </div>
                    </Fragment>
                )}
            </FieldArray>
        </div>
    )
}

interface FilterActionsItemProps {
    action: Action;
    clients: DownloadClient[];
    idx: number;
    remove: any;
}

function FilterActionsItem({ action, clients, idx, remove }: FilterActionsItemProps) {
    const [deleteModalIsOpen, toggleDeleteModal] = useToggle(false);
    const [edit, toggleEdit] = useToggle(false);

    // const enabledMutation = useMutation(
    //     (actionID: number) => APIClient.actions.toggleEnable(actionID),
    //     {
    //         onSuccess: () => {
    //             // queryClient.invalidateQueries(["filter", filterID]);
    //         },
    //     }
    // );

    // const toggleActive = () => {
    //     console.log("action: ", action);

    //     enabledMutation.mutate(action.id);
    // };

    const cancelButtonRef = useRef(null);

    const TypeForm = (actionType: ActionType) => {
        switch (actionType) {
            case "TEST":
                return (
                    <AlertWarning
                        title="Notice"
                        text="The test action does nothing except to show if the filter works."
                    />
                );
            case "EXEC":
                return (
                    <div>
                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <TextField
                                name={`actions.${idx}.exec_cmd`}
                                label="Command"
                                columns={6}
                                placeholder="Path to program eg. /bin/test"
                            />
                            <TextField
                                name={`actions.${idx}.exec_args`}
                                label="Arguments"
                                columns={6}
                                placeholder="Arguments eg. --test"
                            />
                        </div>
                    </div>
                );
            case "WATCH_FOLDER":
                return (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <TextField
                            name={`actions.${idx}.watch_folder`}
                            label="Watch folder"
                            columns={6}
                            placeholder="Watch directory eg. /home/user/rwatch"
                        />
                    </div>
                );
            case "QBITTORRENT":
                return (
                    <div className="w-full">
                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <DownloadClientSelect
                                name={`actions.${idx}.client_id`}
                                action={action}
                                clients={clients}
                            />

                            <div className="col-span-6 sm:col-span-6">
                                <TextField
                                    name={`actions.${idx}.save_path`}
                                    label="Save path"
                                    columns={6}
                                    placeholder="eg. /full/path/to/watch_folder"
                                />
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <TextField name={`actions.${idx}.category`} label="Category" columns={6} placeholder="eg. category" />
                            <TextField name={`actions.${idx}.tags`} label="Tags" columns={6} placeholder="eg. tag1,tag2" />
                        </div>

                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <NumberField
                                name={`actions.${idx}.limit_download_speed`}
                                label="Limit download speed (KB/s)"
                            />
                            <NumberField
                                name={`actions.${idx}.limit_upload_speed`}
                                label="Limit upload speed (KB/s)"
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <div className="col-span-6">
                                <SwitchGroup
                                    name={`actions.${idx}.paused`}
                                    label="Add paused"
                                />
                            </div>
                        </div>
                    </div>
                );
            case "DELUGE_V1":
            case "DELUGE_V2":
                return (
                    <div>
                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <DownloadClientSelect
                                name={`actions.${idx}.client_id`}
                                action={action}
                                clients={clients}
                            />

                            <div className="col-span-12 sm:col-span-6">
                                <TextField
                                    name={`actions.${idx}.save_path`}
                                    label="Save path"
                                    columns={6}
                                />
                            </div>
                        </div>

                        <div className="mt-6 col-span-12 sm:col-span-6">
                            <TextField
                                name={`actions.${idx}.label`}
                                label="Label"
                                columns={6}
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <NumberField
                                name={`actions.${idx}.limit_download_speed`}
                                label="Limit download speed (KB/s)"
                            />
                            <NumberField
                                name={`actions.${idx}.limit_upload_speed`}
                                label="Limit upload speed (KB/s)"
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <div className="col-span-6">
                                <SwitchGroup
                                    name={`actions.${idx}.paused`}
                                    label="Add paused"
                                />
                            </div>
                        </div>
                    </div>
                );
            case "RADARR":
            case "SONARR":
            case "LIDARR":
                return (
                    <div className="mt-6 grid grid-cols-12 gap-6">
                        <DownloadClientSelect
                            name={`actions.${idx}.client_id`}
                            action={action}
                            clients={clients}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <li>
            <div
                className={classNames(
                    idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700",
                    "flex items-center sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-600"
                )}
            >
                <Field name={`actions.${idx}.enabled`} type="checkbox">
                    {({
                        field,
                        form: { setFieldValue },
                    }: any) => (
                        <SwitchBasic
                            {...field}
                            type="button"
                            value={field.value}
                            checked={field.checked}
                            onChange={value => {
                                setFieldValue(field?.name ?? '', value)
                            }}
                            className={classNames(
                                field.value ? 'bg-teal-500 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600',
                                'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            )}
                        >
                            <span className="sr-only">toggle enabled</span>
                            <span
                                aria-hidden="true"
                                className={classNames(
                                    field.value ? 'translate-x-5' : 'translate-x-0',
                                    'inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
                                )}
                            />
                        </SwitchBasic>
                    )}
                </Field>

                <button className="px-4 py-4 w-full flex block" type="button" onClick={toggleEdit}>
                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                        <div className="truncate">
                            <div className="flex text-sm">
                                <p className="ml-4 font-medium text-indigo-600 dark:text-gray-100 truncate">
                                    {action.name}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                            <div className="flex overflow-hidden -space-x-1">
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                    {ActionTypeNameMap[action.type]}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                        <ChevronRightIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </div>
                </button>

            </div>
            {edit && (
                <div className="px-4 py-4 flex items-center sm:px-6 border dark:border-gray-600">
                    <Transition.Root show={deleteModalIsOpen} as={Fragment}>
                        <Dialog
                            as="div"
                            static
                            className="fixed inset-0 overflow-y-auto"
                            initialFocus={cancelButtonRef}
                            open={deleteModalIsOpen}
                            onClose={toggleDeleteModal}
                        >
                            <DeleteModal
                                isOpen={deleteModalIsOpen}
                                buttonRef={cancelButtonRef}
                                toggle={toggleDeleteModal}
                                deleteAction={() => remove(idx)}
                                title="Remove filter action"
                                text="Are you sure you want to remove this action? This action cannot be undone."
                            />
                        </Dialog>
                    </Transition.Root>

                    <div className="w-full">

                        <div className="mt-6 grid grid-cols-12 gap-6">
                            <Select
                                name={`actions.${idx}.type`}
                                label="Type"
                                optionDefaultText="Select type"
                                options={ActionTypeOptions}
                            />

                            <TextField name={`actions.${idx}.name`} label="Name" columns={6} />
                        </div>

                        {TypeForm(action.type)}

                        <div className="pt-6 divide-y divide-gray-200">
                            <div className="mt-4 pt-4 flex justify-between">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center py-2 border border-transparent font-medium rounded-md text-red-700 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                                    onClick={toggleDeleteModal}
                                >
                                    Remove
                                </button>

                                <div>
                                    <button
                                        type="button"
                                        className="light:bg-white light:border light:border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 dark:text-gray-500 light:hover:bg-gray-50 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        onClick={toggleEdit}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </li>
    )
}
