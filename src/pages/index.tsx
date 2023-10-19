import React, {useCallback, useMemo, useState} from 'react';
import {Layout} from "@trending/components/layout";
import {useSession} from "next-auth/react";
import axios from "axios";
import {toast} from "react-toastify";
import {GetServerSideProps} from "next";
import {getServerSession} from "next-auth/next";
import {nextOptions} from "@trending/pages/api/auth/[...nextauth]";
import {prisma} from "../../prisma/prisma";

function Index({list}: {list: string[]}) {
    const {data} = useSession();
    const [repository, setRepository] = useState('');
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(list as string[]);
    const add = useCallback(async () => {
        setLoading(true);
        const {data} = await axios.post('/api/add', {
            repository
        });
        if (data.valid) {
            setAdded((val) => {
                return [...val, repository];
            });
            toast.success('You have subscribed to the new repository!');
        }
        else {
            toast.error('Could not add repository!');
        }
        setRepository('');
        setLoading(false);
    }, [repository, added, setAdded]);

    const remove = useCallback((repo: string) => async () => {
        const {data} = await axios.post('/api/remove', {
            repository: repo
        });
        if (data.valid) {
            setAdded((val) => {
                return val.filter(f => f !== repo);
            });
            toast.success('You have unsubscribed from the repository!');
        }
        else {
            toast.error('Could not unsubscribe!');
        }
        setLoading(false);
    }, [added, setAdded]);

    const valid = useMemo(() => {
        return !!repository.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/);
    }, [repository]);
    return (
        <Layout>
            <div className="flex items-center mb-5">
                <div className="mr-3">Your email for notifications: {data?.user?.email!}</div>
            </div>
            <hr className="mb-5" />
            Which GitHub libraries would you like to monitor?
            <div className="w-full flex mt-2">
                <input placeholder="Type https://github.com/clickvote/clickvote" disabled={loading} className={`p-2 bg-black/20 flex-1 ${loading ? 'opacity-20' : ''}`} value={repository} onChange={e => setRepository(e.target.value)} />
                <button className={`ml-3 cursor-pointer ${!valid ? 'opacity-20' : ''}`} disabled={!valid || loading} onClick={add}>{loading ? 'Loading' : '+ Add'}</button>
            </div>
            <hr className="my-5 mb-3" />
            <div className="w-full mt-2 flex flex-col">
                {added.map(l => (
                    <div className="mb-1 flex items-center" key={l}>
                        <button onClick={remove(l)} className="bg-red-500 w-[20px] h-[20px] mr-2 rounded-full text-xs text-white">X</button>
                        <span>{l}</span>
                    </div>
                ))}
            </div>
        </Layout>
    );
}

export const getServerSideProps = (async (context) => {
    const user = await getServerSession(context.req, context.res, nextOptions);
    if (!user) {
        return {
            props: {
                list: []
            }
        }
    }
    const list = await prisma.userRepository.findMany({
        where: {
            // @ts-ignore
            userId: user.user.id
        },
        include: {
            repository: {
                select: {
                    url: true
                }
            }
        }
    });

    return {
        props: {
            list: list.map(p => p.repository.url)
        }
    }
}) satisfies GetServerSideProps;

export default Index;